import { punchItemRepository } from '../repositories/punchItemRepository';
import { projectRepository, ProjectRole } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { userRepository } from '../repositories/userRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { notificationService } from './notificationService';
import { GovernanceError } from './governanceError';
import {
  PunchItem,
  PunchItemStatus,
  PunchItemPriority,
  PunchItemCategory,
  UserProfile,
} from '../../src/types';

export class PunchItemService {
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

  private async getActorDetails(userId: string): Promise<{ user: UserProfile | null; fullName: string }> {
    const user = (await userRepository.findByAuthUserId(userId)) || (await userRepository.findById(userId));
    const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Project Participant';
    return { user: user as any, fullName };
  }

  async listPunchItems(projectId: string, userId: string): Promise<PunchItem[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: You do not have an active appointment on this project.');
    }
    return punchItemRepository.listPunchItemsByProject(projectId);
  }

  async getPunchItemById(projectId: string, punchId: string, userId: string): Promise<PunchItem> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: You do not have an active appointment on this project.');
    }
    const item = await punchItemRepository.getPunchItemById(punchId);
    if (!item || item.projectId !== projectId) {
      throw new GovernanceError(404, 'NOT_FOUND', 'Punch item not found.');
    }
    return item;
  }

  async createPunchItem(
    projectId: string,
    userId: string,
    data: {
      title: string;
      description: string;
      category: PunchItemCategory;
      priority: PunchItemPriority;
      milestoneId?: string;
      assignedToUserId?: string;
      evidenceIds?: string[];
      location?: string;
      trade?: string;
      notes?: string;
    }
  ): Promise<PunchItem> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required to raise punch items.');
    }

    const { fullName: raisedByName } = await this.getActorDetails(userId);
    const existing = await punchItemRepository.listPunchItemsByProject(projectId);
    const itemNumber = `PUNCH-${String(existing.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString();

    let assignedToName: string | undefined;
    let assignedToRole: ProjectRole | undefined;
    if (data.assignedToUserId) {
      const assignedDetails = await this.getActorDetails(data.assignedToUserId);
      assignedToName = assignedDetails.fullName;
      assignedToRole = (await this.resolveUserProjectRole(projectId, data.assignedToUserId)) || undefined;
    }

    const initialStatus: PunchItemStatus = data.assignedToUserId ? 'ASSIGNED' : 'OPEN';

    const punchItem: PunchItem = {
      id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      projectId,
      number: itemNumber,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority,
      status: initialStatus,
      milestoneId: data.milestoneId,
      raisedByUserId: userId,
      raisedByRole: role,
      raisedByName,
      raisedAt: now,
      assignedToUserId: data.assignedToUserId,
      assignedToRole,
      assignedToName,
      assignedAt: data.assignedToUserId ? now : undefined,
      evidenceIds: data.evidenceIds || [],
      location: data.location,
      trade: data.trade,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    const created = await punchItemRepository.createPunchItem(punchItem);

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PUNCH_ITEM_CREATED',
      entityType: 'PUNCH_ITEM',
      entityId: created.id,
      metadata: {
        number: created.number,
        title: created.title,
        priority: created.priority,
        category: created.category,
        assignedToUserId: created.assignedToUserId,
      },
    });

    if (data.assignedToUserId) {
      await notificationService.sendNotification({
        projectId,
        recipientUserId: data.assignedToUserId,
        recipientRole: assignedToRole,
        type: 'PUNCH_ITEM_ASSIGNED',
        title: `Assigned: Punch Item ${created.number}`,
        message: `${raisedByName} (${role}) assigned punch item "${created.title}" with priority ${created.priority}.`,
        severity: data.priority === 'CRITICAL' ? 'CRITICAL' : 'ACTION_REQUIRED',
        relatedRecordType: 'PUNCH_ITEM',
        relatedRecordId: created.id,
      });
    }

    return created;
  }

  async assignPunchItem(
    projectId: string,
    punchId: string,
    userId: string,
    assignedToUserId: string
  ): Promise<PunchItem> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required to assign punch items.');
    }

    if (role !== 'SENIOR_PROJECT_DIRECTOR' && role !== 'OWNER_CLIENT' && role !== 'STRUCTURAL_QA_QC_AUDITOR') {
      throw new GovernanceError(403, 'FORBIDDEN', 'Only Project Directors, QA/QC Auditors, or Owners can assign punch items.');
    }

    const item = await this.getPunchItemById(projectId, punchId, userId);
    if (item.status === 'CLOSED') {
      throw new GovernanceError(400, 'INVALID_STATE', 'Cannot reassign a closed punch item.');
    }

    const assignedDetails = await this.getActorDetails(assignedToUserId);
    const assignedToRole = (await this.resolveUserProjectRole(projectId, assignedToUserId)) || undefined;
    const now = new Date().toISOString();

    const updated = await punchItemRepository.updatePunchItem(punchId, {
      assignedToUserId,
      assignedToName: assignedDetails.fullName,
      assignedToRole,
      assignedAt: now,
      status: item.status === 'OPEN' ? 'ASSIGNED' : item.status,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(404, 'NOT_FOUND', 'Failed to update punch item.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PUNCH_ITEM_ASSIGNED',
      entityType: 'PUNCH_ITEM',
      entityId: item.id,
      metadata: {
        number: item.number,
        assignedToUserId,
        assignedToName: assignedDetails.fullName,
      },
    });

    await notificationService.sendNotification({
      projectId,
      recipientUserId: assignedToUserId,
      recipientRole: assignedToRole,
      type: 'PUNCH_ITEM_ASSIGNED',
      title: `Punch Item Assigned: ${item.number}`,
      message: `You have been assigned punch item "${item.title}".`,
      severity: item.priority === 'CRITICAL' ? 'CRITICAL' : 'ACTION_REQUIRED',
      relatedRecordType: 'PUNCH_ITEM',
      relatedRecordId: item.id,
    });

    return updated;
  }

  async markInProgress(projectId: string, punchId: string, userId: string): Promise<PunchItem> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    const item = await this.getPunchItemById(projectId, punchId, userId);
    if (item.status === 'CLOSED' || item.status === 'VERIFIED') {
      throw new GovernanceError(400, 'INVALID_STATE', 'Item is already verified or closed.');
    }

    const now = new Date().toISOString();
    const updated = await punchItemRepository.updatePunchItem(punchId, {
      status: 'IN_PROGRESS',
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(404, 'NOT_FOUND', 'Failed to update punch item.');
    }

    return updated;
  }

  async submitResolution(
    projectId: string,
    punchId: string,
    userId: string,
    data: {
      resolutionDescription: string;
      resolutionEvidenceIds?: string[];
    }
  ): Promise<PunchItem> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    const item = await this.getPunchItemById(projectId, punchId, userId);
    if (item.status === 'CLOSED' || item.status === 'VERIFIED') {
      throw new GovernanceError(400, 'INVALID_STATE', 'Cannot submit resolution for verified/closed item.');
    }

    const { fullName: resolvedByName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const updated = await punchItemRepository.updatePunchItem(punchId, {
      status: 'READY_FOR_VERIFICATION',
      resolutionDescription: data.resolutionDescription.trim(),
      resolutionEvidenceIds: data.resolutionEvidenceIds || [],
      resolvedAt: now,
      resolvedByUserId: userId,
      resolvedByName,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(404, 'NOT_FOUND', 'Failed to update punch item.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PUNCH_ITEM_READY_FOR_VERIFICATION',
      entityType: 'PUNCH_ITEM',
      entityId: item.id,
      metadata: {
        number: item.number,
        resolvedByUserId: userId,
        resolvedByName,
      },
    });

    // Notify the person who raised the item or the Project Director
    if (item.raisedByUserId && item.raisedByUserId !== userId) {
      await notificationService.sendNotification({
        projectId,
        recipientUserId: item.raisedByUserId,
        recipientRole: item.raisedByRole,
        type: 'PUNCH_ITEM_READY_FOR_VERIFICATION',
        title: `Ready for Verification: ${item.number}`,
        message: `${resolvedByName} marked punch item "${item.title}" as resolved and ready for inspection.`,
        severity: 'ACTION_REQUIRED',
        relatedRecordType: 'PUNCH_ITEM',
        relatedRecordId: item.id,
      });
    }

    return updated;
  }

  async verifyPunchItem(
    projectId: string,
    punchId: string,
    userId: string,
    data: {
      decision?: string;
      verificationNotes: string;
    }
  ): Promise<PunchItem> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role === 'GENERAL_CONTRACTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Independent Verification Gate: General Contractor cannot verify their own punch item resolution. Verification must be performed by Senior Project Director, QA/QC Auditor, or Owner.'
      );
    }

    const item = await this.getPunchItemById(projectId, punchId, userId);
    if (item.status !== 'READY_FOR_VERIFICATION') {
      throw new GovernanceError(400, 'INVALID_STATE', 'Item must be in READY_FOR_VERIFICATION state prior to verification sign-off.');
    }

    const { fullName: verifiedByName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const updated = await punchItemRepository.updatePunchItem(punchId, {
      status: 'VERIFIED',
      verificationNotes: data.verificationNotes.trim(),
      verifiedAt: now,
      verifiedByUserId: userId,
      verifiedByName,
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(404, 'NOT_FOUND', 'Failed to update punch item.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PUNCH_ITEM_VERIFIED',
      entityType: 'PUNCH_ITEM',
      entityId: item.id,
      metadata: {
        number: item.number,
        verifiedByUserId: userId,
        verifiedByName,
      },
    });

    if (item.assignedToUserId) {
      await notificationService.sendNotification({
        projectId,
        recipientUserId: item.assignedToUserId,
        recipientRole: item.assignedToRole,
        type: 'PUNCH_ITEM_VERIFIED',
        title: `Verified: Punch Item ${item.number}`,
        message: `${verifiedByName} (${role}) verified completion of punch item "${item.title}".`,
        severity: 'INFO',
        relatedRecordType: 'PUNCH_ITEM',
        relatedRecordId: item.id,
      });
    }

    return updated;
  }

  async closePunchItem(
    projectId: string,
    punchId: string,
    userId: string,
    closingNotes?: string
  ): Promise<PunchItem> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    if (role === 'GENERAL_CONTRACTOR') {
      throw new GovernanceError(
        403,
        'FORBIDDEN',
        'Independent Closure Gate: General Contractor cannot close punch items. Closure requires Project Director, QA/QC Auditor, or Owner.'
      );
    }

    const item = await this.getPunchItemById(projectId, punchId, userId);
    if (item.status !== 'VERIFIED') {
      throw new GovernanceError(400, 'INVALID_STATE', 'Item must be VERIFIED prior to final closure.');
    }

    const { fullName: closedByName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const updated = await punchItemRepository.updatePunchItem(punchId, {
      status: 'CLOSED',
      closedAt: now,
      closedByUserId: userId,
      closedByName,
      closingNotes: closingNotes || 'Formally closed in punch list register.',
      updatedAt: now,
    });

    if (!updated) {
      throw new GovernanceError(404, 'NOT_FOUND', 'Failed to update punch item.');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: now,
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PUNCH_ITEM_CLOSED',
      entityType: 'PUNCH_ITEM',
      entityId: item.id,
      metadata: {
        number: item.number,
        closedByUserId: userId,
        closedByName,
      },
    });

    return updated;
  }
}

export const punchItemService = new PunchItemService();
