import { projectRepository, ProjectRole } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { closeoutRepository, generateDefaultCloseoutChecklist } from '../repositories/closeoutRepository';
import { milestoneRepository } from '../repositories/milestoneRepository';
import { ncrRepository } from '../repositories/ncrRepository';
import { qaqcRepository } from '../repositories/qaqcRepository';
import { punchItemRepository } from '../repositories/punchItemRepository';
import { evidenceRepository } from '../repositories/evidenceRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { notificationService } from './notificationService';
import { userRepository } from '../repositories/userRepository';
import { GovernanceError } from './governanceError';
import {
  ProjectCloseout,
  CloseoutChecklistItem,
  CloseoutGateEvaluation,
  CloseoutCategory,
} from '../../src/types';

export class CloseoutService {
  async resolveUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) return null;

    if (project.ownerUserId === userId) {
      return 'OWNER_CLIENT';
    }

    const appointment = await projectRepository.getAppointmentByProjectAndUser(projectId, userId);
    if (appointment && appointment.appointmentStatus === 'ACTIVE') {
      return appointment.role;
    }

    if (project.organizationId) {
      const org = await organizationRepository.getOrganizationById(project.organizationId);
      if (org && org.ownerUserId === userId) {
        return 'OWNER_CLIENT';
      }
      const membership = await organizationRepository.getMembership(project.organizationId, userId);
      if (membership && membership.status === 'ACTIVE' && membership.organizationRole === 'OWNER_ADMIN') {
        return 'OWNER_CLIENT';
      }
    }

    return null;
  }

  private async getActorDetails(userId: string) {
    const user = (await userRepository.findByAuthUserId(userId)) || (await userRepository.findById(userId));
    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Project Participant';
    return { user, fullName };
  }

  async evaluateCloseoutGates(projectId: string): Promise<CloseoutGateEvaluation> {
    const blockers: string[] = [];

    // 1. Milestone completion check
    const milestones = await milestoneRepository.listMilestonesByProject(projectId);
    const unapprovedMilestones = milestones.filter(
      m => m.status !== 'APPROVED' && m.status !== 'COMPLETE'
    );
    const requiredMilestonesComplete = unapprovedMilestones.length === 0;
    if (!requiredMilestonesComplete) {
      blockers.push(
        `${unapprovedMilestones.length} milestone(s) have not reached formal APPROVED or COMPLETE status (${unapprovedMilestones.map(m => m.title).slice(0, 3).join(', ')})`
      );
    }

    // 2. Open blocking NCR check
    const ncrs = await ncrRepository.listNCRsByProject(projectId);
    const openBlockingNCRs = ncrs.filter(
      n => n.status !== 'CLOSED' && (n.severity === 'CRITICAL' || n.severity === 'MAJOR')
    );
    const openBlockingNCRsCount = openBlockingNCRs.length;
    if (openBlockingNCRsCount > 0) {
      blockers.push(
        `${openBlockingNCRsCount} high-severity Non-Conformance Report(s) remain open in the NCR register (${openBlockingNCRs.map(n => n.number).join(', ')})`
      );
    }

    // 3. Unresolved QA/QC check
    const inspections = await qaqcRepository.listInspectionsByProject(projectId);
    const unresolvedQAQC = inspections.filter(
      i => i.inspectionStatus === 'FAILED' || i.inspectionStatus === 'HOLD'
    );
    const unresolvedQAQCCount = unresolvedQAQC.length;
    if (unresolvedQAQCCount > 0) {
      blockers.push(`${unresolvedQAQCCount} structural QA/QC inspection(s) are currently on HOLD or FAILED`);
    }

    // 4. Missing required evidence
    const evidence = await evidenceRepository.listEvidenceByProject(projectId);
    const missingRequiredEvidenceCount = (milestones.length > 0 && evidence.length === 0) ? 1 : 0;
    if (missingRequiredEvidenceCount > 0) {
      blockers.push('No verified structural or architectural evidence records registered on project');
    }

    // 5. Open critical punch list items
    const punchItems = await punchItemRepository.listPunchItemsByProject(projectId);
    const unresolvedCriticalPunch = punchItems.filter(
      p => p.status !== 'CLOSED' && (p.priority === 'CRITICAL' || p.priority === 'HIGH')
    );
    const unresolvedCriticalPunchCount = unresolvedCriticalPunch.length;
    if (unresolvedCriticalPunchCount > 0) {
      blockers.push(
        `${unresolvedCriticalPunchCount} high/critical priority Punch List item(s) remain unresolved (${unresolvedCriticalPunch.map(p => p.number).join(', ')})`
      );
    }

    // 6. Closeout checklist items evaluation
    const closeout = await closeoutRepository.getCloseoutByProject(projectId);
    let allRequiredChecklistItemsPassed = true;
    if (closeout && closeout.checklist) {
      const incompleteRequired = closeout.checklist.filter(c => c.isRequired && !c.isCompleted);
      if (incompleteRequired.length > 0) {
        allRequiredChecklistItemsPassed = false;
        blockers.push(`${incompleteRequired.length} mandatory closeout checklist item(s) remain unchecked`);
      }
    }

    return {
      canComplete: blockers.length === 0,
      blockers,
      gateDetails: {
        requiredMilestonesComplete,
        openBlockingNCRsCount,
        unresolvedQAQCCount,
        missingRequiredEvidenceCount,
        unresolvedCriticalPunchCount,
        allRequiredChecklistItemsPassed,
      },
    };
  }

  async getCloseout(projectId: string, userId: string): Promise<{
    closeout: ProjectCloseout;
    evaluation: CloseoutGateEvaluation;
  }> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    let closeout = await closeoutRepository.getCloseoutByProject(projectId);
    if (!closeout) {
      // Return a provisional closeout model with default checklist
      const { fullName } = await this.getActorDetails(userId);
      const now = new Date().toISOString();
      closeout = {
        id: `closeout-${projectId}`,
        projectId,
        status: 'NOT_STARTED',
        initiatedByUserId: userId,
        initiatedByRole: role,
        initiatedByName: fullName,
        initiatedAt: now,
        checklist: generateDefaultCloseoutChecklist(`closeout-${projectId}`),
        createdAt: now,
        updatedAt: now,
      };
    }

    const evaluation = await this.evaluateCloseoutGates(projectId);
    return { closeout, evaluation };
  }

  async startCloseout(projectId: string, userId: string): Promise<ProjectCloseout> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR' && role !== 'OWNER_CLIENT') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Only Senior Project Director or Owner/Client can formally initiate the project closeout process.'
      );
    }

    let closeout = await closeoutRepository.getCloseoutByProject(projectId);
    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();
    const evaluation = await this.evaluateCloseoutGates(projectId);

    if (!closeout) {
      closeout = {
        id: `closeout-${projectId}`,
        projectId,
        status: 'IN_PROGRESS',
        initiatedByUserId: userId,
        initiatedByRole: role,
        initiatedByName: fullName,
        initiatedAt: now,
        checklist: generateDefaultCloseoutChecklist(`closeout-${projectId}`),
        createdAt: now,
        updatedAt: now,
      };
      await closeoutRepository.saveCloseout(closeout);
    } else {
      closeout = (await closeoutRepository.updateCloseout(projectId, {
        status: 'IN_PROGRESS',
        initiatedByUserId: userId,
        initiatedByRole: role,
        initiatedByName: fullName,
        initiatedAt: now,
        updatedAt: now,
      })) || closeout;
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'CLOSEOUT_STARTED',
      entityType: 'PROJECT_CLOSEOUT',
      entityId: closeout.id,
      metadata: {
        initiatedByRole: role,
        canComplete: evaluation.canComplete,
      },
    });

    return closeout;
  }

  async updateChecklistItem(
    projectId: string,
    itemId: string,
    userId: string,
    updates: {
      isCompleted: boolean;
      notes?: string;
      verifiedReferenceId?: string;
    }
  ): Promise<ProjectCloseout> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    // GENERAL_CONTRACTOR cannot unilaterally mark governance checklist items complete
    if (role === 'GENERAL_CONTRACTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'General Contractor cannot sign off on closeout governance items. Sign-off requires Project Director, QA/QC Auditor, or Owner.'
      );
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const partialItem: Partial<CloseoutChecklistItem> = {
      isCompleted: updates.isCompleted,
      completedAt: updates.isCompleted ? now : undefined,
      completedByUserId: updates.isCompleted ? userId : undefined,
      completedByName: updates.isCompleted ? fullName : undefined,
      notes: updates.notes,
      verifiedReferenceId: updates.verifiedReferenceId,
    };

    let updatedCloseout = await closeoutRepository.updateChecklistItem(projectId, itemId, partialItem);
    if (!updatedCloseout) {
      // Auto-start if not created yet
      await this.startCloseout(projectId, userId);
      updatedCloseout = await closeoutRepository.updateChecklistItem(projectId, itemId, partialItem);
    }

    if (!updatedCloseout) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to update checklist item.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'CLOSEOUT_ITEM_COMPLETED',
      entityType: 'CLOSEOUT_CHECKLIST_ITEM',
      entityId: itemId,
      metadata: {
        isCompleted: updates.isCompleted,
        completedByRole: role,
        itemId,
      },
    });

    return updatedCloseout;
  }

  async submitCloseoutForReview(projectId: string, userId: string): Promise<ProjectCloseout> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Only Senior Project Director can submit the project closeout package for final Owner review.'
      );
    }

    const evaluation = await this.evaluateCloseoutGates(projectId);
    if (!evaluation.canComplete) {
      throw new GovernanceError(
        400,
        'CLOSEOUT_GATES_BLOCKED',
        `Closeout review submission blocked: ${evaluation.blockers.join('; ')}`
      );
    }

    const now = new Date().toISOString();
    const updated = await closeoutRepository.updateCloseout(projectId, {
      status: 'READY_FOR_REVIEW',
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to update closeout status.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'CLOSEOUT_READY_FOR_REVIEW',
      entityType: 'PROJECT_CLOSEOUT',
      entityId: updated.id,
      metadata: {
        submittedByUserId: userId,
      },
    });

    return updated;
  }

  async completeCloseout(
    projectId: string,
    userId: string,
    data?: { closeoutNotes?: string }
  ): Promise<ProjectCloseout> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    // Owner or Senior Project Director must formally complete closeout
    if (role !== 'OWNER_CLIENT' && role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Only Owner/Client or Senior Project Director has authority to formally complete project closeout.'
      );
    }

    const evaluation = await this.evaluateCloseoutGates(projectId);
    if (!evaluation.canComplete) {
      throw new GovernanceError(
        400,
        'CLOSEOUT_GATES_BLOCKED',
        `Closeout cannot be completed due to active blockers: ${evaluation.blockers.join('; ')}`
      );
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const updated = await closeoutRepository.updateCloseout(projectId, {
      status: 'COMPLETED',
      completedAt: now,
      completedByUserId: userId,
      completedByRole: role,
      completedByName: fullName,
      summary: data?.closeoutNotes,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to complete closeout.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'CLOSEOUT_COMPLETED',
      entityType: 'PROJECT_CLOSEOUT',
      entityId: updated.id,
      metadata: {
        completedByUserId: userId,
        completedByRole: role,
      },
    });

    return updated;
  }

  async returnCloseout(
    projectId: string,
    userId: string,
    data: { returnReason: string }
  ): Promise<ProjectCloseout> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role !== 'OWNER_CLIENT' && role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Only Owner/Client or Senior Project Director can return closeout for rectification.'
      );
    }

    const now = new Date().toISOString();
    const updated = await closeoutRepository.updateCloseout(projectId, {
      status: 'RETURNED',
      returnReason: data.returnReason,
      summary: `Returned: ${data.returnReason}`,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to return closeout.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'CLOSEOUT_RETURNED',
      entityType: 'PROJECT_CLOSEOUT',
      entityId: updated.id,
      metadata: {
        returnedByUserId: userId,
        returnReason: data.returnReason,
      },
    });

    return updated;
  }
}

export const closeoutService = new CloseoutService();
