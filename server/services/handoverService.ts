import { projectRepository, ProjectRole } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { handoverRepository } from '../repositories/handoverRepository';
import { milestoneRepository } from '../repositories/milestoneRepository';
import { ncrRepository } from '../repositories/ncrRepository';
import { qaqcRepository } from '../repositories/qaqcRepository';
import { punchItemRepository } from '../repositories/punchItemRepository';
import { evidenceRepository } from '../repositories/evidenceRepository';
import { closeoutRepository } from '../repositories/closeoutRepository';
import { technicalReviewRepository } from '../repositories/technicalReviewRepository';
import { ownerDecisionRepository } from '../repositories/ownerDecisionRepository';
import { projectDecisionRepository } from '../repositories/projectDecisionRepository';
import { rfiRepository } from '../repositories/rfiRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { notificationService } from './notificationService';
import { userRepository } from '../repositories/userRepository';
import { GovernanceError } from './governanceError';
import {
  ProjectHandover,
  HandoverReadinessEvaluation,
  HandoverStatus,
  HandoverChecklistItem,
} from '../../src/types';

export class HandoverService {
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

  async evaluateHandoverReadiness(projectId: string): Promise<HandoverReadinessEvaluation> {
    const blockers: string[] = [];

    // 1. Closeout satisfied
    const closeout = await closeoutRepository.getCloseoutByProject(projectId);
    const closeoutSatisfied = closeout ? closeout.status === 'COMPLETED' || closeout.status === 'READY_FOR_REVIEW' : false;
    if (!closeoutSatisfied) {
      blockers.push('Project closeout workflow has not reached COMPLETED or READY_FOR_REVIEW status');
    }

    // 2. Milestones approved
    const milestones = await milestoneRepository.listMilestonesByProject(projectId);
    const unapprovedMilestones = milestones.filter(
      m => m.status !== 'APPROVED' && m.status !== 'COMPLETE'
    );
    const requiredMilestonesApproved = unapprovedMilestones.length === 0;
    if (!requiredMilestonesApproved) {
      blockers.push(`${unapprovedMilestones.length} milestone(s) are not fully approved or completed`);
    }

    // 3. QA/QC passed
    const inspections = await qaqcRepository.listInspectionsByProject(projectId);
    const failedInspections = inspections.filter(
      i => i.inspectionStatus === 'FAILED' || i.inspectionStatus === 'HOLD'
    );
    const requiredQAQCPassed = failedInspections.length === 0;
    if (!requiredQAQCPassed) {
      blockers.push(`${failedInspections.length} QA/QC inspection(s) remain in FAILED or HOLD status`);
    }

    // 4. No open blocking NCRs
    const ncrs = await ncrRepository.listNCRsByProject(projectId);
    const openBlockingNCRs = ncrs.filter(
      n => n.status !== 'CLOSED' && (n.severity === 'CRITICAL' || n.severity === 'MAJOR')
    );
    const noOpenBlockingNCRs = openBlockingNCRs.length === 0;
    if (!noOpenBlockingNCRs) {
      blockers.push(`${openBlockingNCRs.length} high/critical Non-Conformance Report(s) remain open`);
    }

    // 5. No open critical punch items
    const punchItems = await punchItemRepository.listPunchItemsByProject(projectId);
    const openCriticalPunch = punchItems.filter(
      p => p.status !== 'CLOSED' && (p.priority === 'CRITICAL' || p.priority === 'HIGH')
    );
    const noCriticalPunchItems = openCriticalPunch.length === 0;
    if (!noCriticalPunchItems) {
      blockers.push(`${openCriticalPunch.length} critical or high-priority Punch List items remain unclosed`);
    }

    // 6. Required Owner decisions recorded
    const ownerDecisions = await ownerDecisionRepository.listDecisionsByProject(projectId);
    const requiredOwnerDecisionsRecorded = milestones.length === 0 || ownerDecisions.length > 0;
    if (!requiredOwnerDecisionsRecorded) {
      blockers.push('No formal Owner milestone governance decisions recorded on project');
    }

    // 7. Evidence available
    const evidence = await evidenceRepository.listEvidenceByProject(projectId);
    const requiredEvidenceAvailable = milestones.length === 0 || evidence.length > 0;
    if (!requiredEvidenceAvailable) {
      blockers.push('No verified engineering or quality evidence attached to project records');
    }

    return {
      isReady: blockers.length === 0,
      blockers,
      gates: {
        closeoutSatisfied,
        requiredMilestonesApproved,
        requiredQAQCPassed,
        noOpenBlockingNCRs,
        noCriticalPunchItems,
        requiredOwnerDecisionsRecorded,
        requiredEvidenceAvailable,
      },
    };
  }

  async updateChecklistItem(
    projectId: string,
    itemId: string,
    userId: string,
    updates: {
      isCompleted?: boolean;
      notes?: string;
      verifiedReferenceId?: string;
    }
  ): Promise<ProjectHandover> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role === 'GENERAL_CONTRACTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'General Contractor cannot certify handover deliverable checklist items.'
      );
    }

    const handover = await handoverRepository.getHandoverByProject(projectId);
    if (!handover) {
      throw new GovernanceError(404, 'NOT_FOUND', 'Handover dossier has not been prepared for this project.');
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const updatedChecklist = handover.checklist.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isCompleted: updates.isCompleted !== undefined ? updates.isCompleted : item.isCompleted,
          isSatisfied: updates.isCompleted !== undefined ? updates.isCompleted : item.isSatisfied,
          notes: updates.notes !== undefined ? updates.notes : item.notes,
          verifiedReferenceId: updates.verifiedReferenceId !== undefined ? updates.verifiedReferenceId : item.verifiedReferenceId,
          completedByUserId: updates.isCompleted ? userId : undefined,
          completedByName: updates.isCompleted ? fullName : undefined,
          completedAt: updates.isCompleted ? now : undefined,
        };
      }
      return item;
    });

    const updated = await handoverRepository.updateHandover(projectId, {
      checklist: updatedChecklist,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to update handover checklist item.');
    }

    return updated;
  }

  private async buildIncludedRecordCounts(projectId: string) {
    const [
      milestones,
      evidence,
      technicalReviews,
      qaqcInspections,
      ncrs,
      ownerDecisions,
      projectDecisions,
      rfis,
      punchItems,
      closeout,
    ] = await Promise.all([
      milestoneRepository.listMilestonesByProject(projectId),
      evidenceRepository.listEvidenceByProject(projectId),
      technicalReviewRepository.listReviewsByProject(projectId),
      qaqcRepository.listInspectionsByProject(projectId),
      ncrRepository.listNCRsByProject(projectId),
      ownerDecisionRepository.listDecisionsByProject(projectId),
      projectDecisionRepository.listDecisionsByProject(projectId),
      rfiRepository.listRFIsByProject(projectId),
      punchItemRepository.listPunchItemsByProject(projectId),
      closeoutRepository.getCloseoutByProject(projectId),
    ]);

    return {
      milestones: milestones.length,
      evidence: evidence.length,
      technicalReviews: technicalReviews.length,
      qaqcInspections: qaqcInspections.length,
      ncrs: ncrs.length,
      ownerDecisions: ownerDecisions.length,
      projectDecisions: projectDecisions.length,
      rfis: rfis.length,
      punchItems: punchItems.length,
      closeoutItems: closeout?.checklist ? closeout.checklist.length : 0,
    };
  }

  private buildDefaultHandoverChecklist(evaluation: HandoverReadinessEvaluation): HandoverChecklistItem[] {
    return [
      {
        id: 'hnd-chk-01',
        title: 'Project Closeout Governance Complete',
        category: 'GOVERNANCE',
        isRequired: true,
        isSatisfied: evaluation.gates.closeoutSatisfied,
        notes: evaluation.gates.closeoutSatisfied ? 'Closeout formally verified.' : 'Closeout pending completion.',
      },
      {
        id: 'hnd-chk-02',
        title: 'Milestone Execution & Approval',
        category: 'MILESTONES',
        isRequired: true,
        isSatisfied: evaluation.gates.requiredMilestonesApproved,
        notes: evaluation.gates.requiredMilestonesApproved
          ? 'All designated contract milestones approved.'
          : 'Outstanding unapproved milestones remain.',
      },
      {
        id: 'hnd-chk-03',
        title: 'Independent QA/QC Structural Clearance',
        category: 'QA_QC',
        isRequired: true,
        isSatisfied: evaluation.gates.requiredQAQCPassed,
        notes: evaluation.gates.requiredQAQCPassed
          ? 'Zero held or failed structural inspections.'
          : 'Inspections require auditor sign-off.',
      },
      {
        id: 'hnd-chk-04',
        title: 'Non-Conformance Reports (NCR) Fully Remediated',
        category: 'QUALITY',
        isRequired: true,
        isSatisfied: evaluation.gates.noOpenBlockingNCRs,
        notes: evaluation.gates.noOpenBlockingNCRs ? 'Zero blocking NCRs.' : 'Open NCRs must be remediated.',
      },
      {
        id: 'hnd-chk-05',
        title: 'Punch List Architectural & Finishing Clearance',
        category: 'COMPLETION',
        isRequired: true,
        isSatisfied: evaluation.gates.noCriticalPunchItems,
        notes: evaluation.gates.noCriticalPunchItems
          ? 'Zero critical punch items outstanding.'
          : 'High/critical punch items remain open.',
      },
      {
        id: 'hnd-chk-06',
        title: 'Technical Review & As-Built Verification',
        category: 'TECHNICAL',
        isRequired: true,
        isSatisfied: evaluation.gates.requiredEvidenceAvailable,
        notes: evaluation.gates.requiredEvidenceAvailable
          ? 'Full laboratory break logs and certificates attached.'
          : 'Missing evidence records.',
      },
      {
        id: 'hnd-chk-07',
        title: 'Owner Milestone Governance Formal Sign-offs',
        category: 'OWNER_GOVERNANCE',
        isRequired: true,
        isSatisfied: evaluation.gates.requiredOwnerDecisionsRecorded,
        notes: evaluation.gates.requiredOwnerDecisionsRecorded
          ? 'Owner approvals and financial authorizations logged.'
          : 'Owner review pending.',
      },
    ];
  }

  async getHandover(projectId: string, userId: string): Promise<{
    handover: ProjectHandover;
    readiness: HandoverReadinessEvaluation;
  }> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    const readiness = await this.evaluateHandoverReadiness(projectId);
    let handover = await handoverRepository.getHandoverByProject(projectId);

    if (!handover) {
      const counts = await this.buildIncludedRecordCounts(projectId);
      const checklist = this.buildDefaultHandoverChecklist(readiness);
      const now = new Date().toISOString();

      handover = {
        id: `handover-${projectId}`,
        projectId,
        status: 'NOT_READY',
        includedRecordCounts: counts,
        checklist,
        createdAt: now,
        updatedAt: now,
      };
    }

    return { handover, readiness };
  }

  async prepareHandover(
    projectId: string,
    userId: string,
    data: {
      targetHandoverDate?: string;
      handoverNotes?: string;
    } = {}
  ): Promise<ProjectHandover> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR' && role !== 'OWNER_CLIENT') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Only Senior Project Director or Owner/Client can prepare the project handover dossier.'
      );
    }

    const readiness = await this.evaluateHandoverReadiness(projectId);
    const counts = await this.buildIncludedRecordCounts(projectId);
    const checklist = this.buildDefaultHandoverChecklist(readiness);
    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    let existing = await handoverRepository.getHandoverByProject(projectId);
    let saved: ProjectHandover;

    if (!existing) {
      saved = {
        id: `handover-${projectId}`,
        projectId,
        status: 'IN_PREPARATION',
        targetHandoverDate: data?.targetHandoverDate,
        preparedByUserId: userId,
        preparedByRole: role,
        preparedByName: fullName,
        preparedAt: now,
        handoverNotes: data?.handoverNotes,
        includedRecordCounts: counts,
        checklist,
        createdAt: now,
        updatedAt: now,
      };
      await handoverRepository.saveHandover(saved);
    } else {
      saved = (await handoverRepository.updateHandover(projectId, {
        status: 'IN_PREPARATION',
        targetHandoverDate: data?.targetHandoverDate || existing.targetHandoverDate,
        preparedByUserId: userId,
        preparedByRole: role,
        preparedByName: fullName,
        preparedAt: now,
        handoverNotes: data?.handoverNotes || existing.handoverNotes,
        includedRecordCounts: counts,
        checklist,
        updatedAt: now,
      })) || existing;
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'HANDOVER_PREPARED',
      entityType: 'PROJECT_HANDOVER',
      entityId: saved.id,
      metadata: {
        preparedByRole: role,
        isReady: readiness.isReady,
      },
    });

    return saved;
  }

  async submitHandoverForReview(projectId: string, userId: string): Promise<ProjectHandover> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Only Senior Project Director can submit the project handover package for Owner review.'
      );
    }

    const readiness = await this.evaluateHandoverReadiness(projectId);
    if (!readiness.isReady) {
      throw new GovernanceError(
        400,
        'HANDOVER_GATES_BLOCKED',
        `Handover cannot be submitted for review: ${readiness.blockers.join('; ')}`
      );
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const updated = await handoverRepository.updateHandover(projectId, {
      status: 'READY_FOR_REVIEW',
      reviewedByUserId: userId,
      reviewedByRole: role,
      reviewedByName: fullName,
      reviewedAt: now,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to update handover status.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'HANDOVER_READY_FOR_REVIEW',
      entityType: 'PROJECT_HANDOVER',
      entityId: updated.id,
      metadata: {
        submittedByUserId: userId,
      },
    });

    if (project?.ownerUserId) {
      try {
        await notificationService.sendNotification({
          projectId,
          recipientUserId: project.ownerUserId,
          recipientRole: 'OWNER_CLIENT',
          type: 'HANDOVER_READY_FOR_REVIEW',
          title: 'Handover Package Ready for Owner Review',
          message: `${project.name} handover dossier has been compiled and submitted for your final formal acceptance.`,
          severity: 'ACTION_REQUIRED',
          relatedRecordType: 'PROJECT_HANDOVER',
          relatedRecordId: updated.id,
        });
      } catch (err) {
        console.warn('Failed to send handover notification:', err);
      }
    }

    return updated;
  }

  async acceptHandover(
    projectId: string,
    userId: string,
    data?: { acceptanceNotes?: string }
  ): Promise<ProjectHandover> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    // Formal handover acceptance is exclusive to the OWNER_CLIENT
    if (role !== 'OWNER_CLIENT') {
      throw new GovernanceError(
        403,
        'OWNER_AUTHORITY_REQUIRED',
        'Formal project handover acceptance is strictly reserved for the Owner/Client.'
      );
    }

    const readiness = await this.evaluateHandoverReadiness(projectId);
    if (!readiness.isReady) {
      throw new GovernanceError(
        400,
        'HANDOVER_GATES_BLOCKED',
        `Handover acceptance blocked: ${readiness.blockers.join('; ')}`
      );
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const updated = await handoverRepository.updateHandover(projectId, {
      status: 'HANDOVER_COMPLETE',
      actualHandoverDate: now,
      acceptedByUserId: userId,
      acceptedByRole: role,
      acceptedByName: fullName,
      acceptedAt: now,
      acceptanceNotes: data?.acceptanceNotes || 'Formal handover accepted by Owner/Client.',
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to accept handover.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'HANDOVER_ACCEPTED',
      entityType: 'PROJECT_HANDOVER',
      entityId: updated.id,
      metadata: {
        acceptedByUserId: userId,
        acceptedByRole: role,
      },
    });

    await auditEventRepository.record({
      id: `audit-${Date.now() + 1}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PROJECT_HANDOVER_COMPLETED',
      entityType: 'PROJECT',
      entityId: projectId,
      metadata: {
        completedByUserId: userId,
      },
    });

    return updated;
  }

  async returnHandover(
    projectId: string,
    userId: string,
    data: { returnReason: string }
  ): Promise<ProjectHandover> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role !== 'OWNER_CLIENT') {
      throw new GovernanceError(
        403,
        'OWNER_AUTHORITY_REQUIRED',
        'Only the Owner/Client has authority to return the handover package for rectification.'
      );
    }

    const now = new Date().toISOString();
    const updated = await handoverRepository.updateHandover(projectId, {
      status: 'RETURNED',
      returnReason: data.returnReason,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to return handover.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'HANDOVER_RETURNED',
      entityType: 'PROJECT_HANDOVER',
      entityId: updated.id,
      metadata: {
        returnedByUserId: userId,
        returnReason: data.returnReason,
      },
    });

    return updated;
  }
}

export const handoverService = new HandoverService();
