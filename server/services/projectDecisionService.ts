import { projectRepository } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { projectDecisionRepository } from '../repositories/projectDecisionRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { userRepository } from '../repositories/userRepository';
import { GovernanceError } from './governanceError';
import {
  ProjectDecision,
  ProjectDecisionCategory,
  ProjectRole,
  ProjectDecisionOption,
  ProjectRecordRef,
} from '../../src/types';

export class ProjectDecisionService {
  /**
   * Resolves the authoritative role of a user on a given project.
   */
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

  /**
   * Evaluates if a role is authorized to record an official outcome for a category.
   */
  private isAuthorizedToDecide(role: ProjectRole, category: ProjectDecisionCategory): boolean {
    if (role === 'OWNER_CLIENT') {
      return true; // Owner can decide any project governance category
    }

    if (role === 'SENIOR_PROJECT_DIRECTOR') {
      // Director cannot unilaterally authorize budget contingency expenditures outside baseline without Owner
      if (category === 'BUDGET_CONTINGENCY') {
        return false;
      }
      return true;
    }

    if (role === 'STRUCTURAL_QA_QC_AUDITOR') {
      return category === 'QUALITY_COMPLIANCE' || category === 'MATERIAL_SELECTION';
    }

    // GENERAL_CONTRACTOR cannot unilaterally record formal project decisions
    return false;
  }

  // ==========================================
  // Queries
  // ==========================================

  async listDecisions(projectId: string, userId: string): Promise<ProjectDecision[]> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have an active appointment or authority on this project.'
      );
    }

    return projectDecisionRepository.listDecisionsByProject(projectId);
  }

  async getDecision(projectId: string, decisionId: string, userId: string): Promise<ProjectDecision> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have authority to view decisions for this project.'
      );
    }

    const decision = await projectDecisionRepository.getDecisionById(decisionId);
    if (!decision || decision.projectId !== projectId) {
      throw new GovernanceError(404, 'DECISION_NOT_FOUND', 'Project decision not found.');
    }

    return decision;
  }

  // ==========================================
  // Mutations
  // ==========================================

  async createDecision(
    projectId: string,
    userId: string,
    data: {
      title: string;
      subject: string;
      description: string;
      category: ProjectDecisionCategory;
      decisionAuthorityRole?: ProjectRole;
      proposeImmediately?: boolean;
      options?: Array<{
        id?: string;
        title: string;
        description: string;
        costImpactUSD?: number;
        scheduleImpactDays?: number;
        isRecommended?: boolean;
      }>;
      rationale?: string;
      status?: 'DRAFT' | 'PROPOSED';
      relatedRecordRefs?: ProjectRecordRef[];
    }
  ): Promise<ProjectDecision> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have an active appointment to initiate decisions on this project.'
      );
    }

    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      throw new GovernanceError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    }

    const { fullName } = await this.getActorDetails(userId);
    const existing = await projectDecisionRepository.listDecisionsByProject(projectId);
    const seq = existing.length + 1;
    const number = `DEC-${String(seq).padStart(3, '0')}`;
    const id = `dec-${projectId.slice(-6)}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const formattedOptions: ProjectDecisionOption[] = (data.options || []).map((opt, idx) => ({
      id: opt.id || `opt-${idx + 1}-${Date.now().toString().slice(-4)}`,
      title: opt.title,
      description: opt.description,
      costImpactUSD: opt.costImpactUSD ?? 0,
      scheduleImpactDays: opt.scheduleImpactDays ?? 0,
      isRecommended: Boolean(opt.isRecommended),
    }));

    const status = data.status || (data.proposeImmediately ? 'PROPOSED' : (data.proposeImmediately === false ? 'DRAFT' : 'PROPOSED'));
    const decisionAuthorityRole = data.decisionAuthorityRole || (data.category === 'BUDGET_CONTINGENCY' ? 'OWNER_CLIENT' : 'SENIOR_PROJECT_DIRECTOR');

    const decision: ProjectDecision = {
      id,
      projectId,
      number,
      title: data.title.trim(),
      subject: data.subject.trim(),
      description: data.description.trim(),
      category: data.category,
      status,
      options: formattedOptions,
      rationale: data.rationale?.trim() || '',
      decisionAuthorityRole,
      proposedByUserId: userId,
      proposedByRole: role,
      proposedByName: fullName,
      participants: [
        {
          userId,
          role,
          name: fullName,
        },
      ],
      relatedRecordRefs: data.relatedRecordRefs || [],
      createdAt: now,
      updatedAt: now,
      proposedAt: status === 'PROPOSED' ? now : undefined,
      isDemo: project.isDemo,
    };

    await projectDecisionRepository.createDecision(decision);

    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUserId: userId,
      projectId,
      organizationId: project.organizationId,
      action: (status === 'PROPOSED' ? 'PROJECT_DECISION_PROPOSED' : 'PROJECT_DECISION_CREATED') as any,
      entityType: 'PROJECT_DECISION',
      entityId: id,
      metadata: {
        number,
        title: decision.title,
        category: decision.category,
        status: decision.status,
        proposedByRole: role,
      },
    });

    return decision;
  }

  async proposeDecision(projectId: string, decisionId: string, userId: string, rationale?: string): Promise<ProjectDecision> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority on this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const decision = await this.getDecision(projectId, decisionId, userId);
    if (decision.status !== 'DRAFT') {
      throw {
        statusCode: 400,
        error: `Cannot propose a decision in status ${decision.status}.`,
        code: 'INVALID_DECISION_STATE',
      };
    }

    const now = new Date().toISOString();
    const updates: Partial<ProjectDecision> = {
      status: 'PROPOSED',
      proposedAt: now,
      updatedAt: now,
    };
    if (rationale) {
      updates.rationale = rationale;
    }

    const updated = await projectDecisionRepository.updateDecision(decisionId, updates);
    if (!updated) {
      throw { statusCode: 500, error: 'Failed to update decision', code: 'UPDATE_FAILED' };
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PROJECT_DECISION_PROPOSED' as any,
      entityType: 'PROJECT_DECISION',
      entityId: decisionId,
      metadata: {
        number: updated.number,
        title: updated.title,
        category: updated.category,
      },
    });

    return updated;
  }

  async recordDecisionOutcome(
    projectId: string,
    decisionId: string,
    userId: string,
    data: {
      selectedOptionId?: string;
      selectedOutcome: string;
      rationale: string;
    }
  ): Promise<ProjectDecision> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have authority on this project.'
      );
    }

    if (!data.rationale || !data.rationale.trim()) {
      throw new GovernanceError(
        400,
        'RATIONALE_REQUIRED',
        'Governance rationale is mandatory to record a formal decision outcome.'
      );
    }

    const decision = await this.getDecision(projectId, decisionId, userId);
    if (decision.status !== 'PROPOSED' && decision.status !== 'DRAFT') {
      throw new GovernanceError(
        400,
        'INVALID_DECISION_STATE',
        `Cannot decide an outcome for a decision in status ${decision.status}.`
      );
    }

    // Explicit authority check
    if (decision.decisionAuthorityRole && role !== decision.decisionAuthorityRole && role !== 'OWNER_CLIENT') {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_DECISION_AUTHORITY',
        `Forbidden: Role ${role} is not authorized to decide this decision requiring ${decision.decisionAuthorityRole}.`
      );
    }

    // Role authority check
    if (!this.isAuthorizedToDecide(role, decision.category)) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_DECISION_AUTHORITY',
        `Forbidden: Role ${role} is not authorized to decide category ${decision.category}.`
      );
    }

    const { fullName } = await this.getActorDetails(userId);
    const now = new Date().toISOString();

    const participants = decision.participants || [];
    if (!participants.some(p => p.userId === userId)) {
      participants.push({ userId, role, name: fullName });
    }

    const updates: Partial<ProjectDecision> = {
      status: 'DECIDED',
      selectedOptionId: data.selectedOptionId || decision.selectedOptionId,
      selectedOutcome: data.selectedOutcome.trim(),
      rationale: data.rationale.trim(),
      decisionAuthorityUserId: userId,
      decisionAuthorityRole: role,
      decisionAuthorityName: fullName,
      participants,
      decidedAt: now,
      updatedAt: now,
    };

    const updated = await projectDecisionRepository.updateDecision(decisionId, updates);
    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to record decision');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PROJECT_DECISION_RECORDED' as any,
      entityType: 'PROJECT_DECISION',
      entityId: decisionId,
      metadata: {
        number: updated.number,
        title: updated.title,
        category: updated.category,
        decisionAuthorityRole: role,
        selectedOptionId: updated.selectedOptionId,
        selectedOutcome: updated.selectedOutcome,
      },
    });

    return updated;
  }

  async recordOutcome(
    projectId: string,
    decisionId: string,
    userId: string,
    data: {
      selectedOptionId?: string;
      selectedOutcome: string;
      rationale: string;
    }
  ): Promise<ProjectDecision> {
    return this.recordDecisionOutcome(projectId, decisionId, userId, data);
  }

  async supersedeDecision(
    projectId: string,
    decisionId: string,
    userId: string,
    data: {
      supersedingDecisionId?: string;
      supersededReason: string;
      newDecision?: {
        title: string;
        subject?: string;
        description?: string;
        category?: ProjectDecisionCategory;
        decisionAuthorityRole?: ProjectRole;
        options?: any[];
        proposeImmediately?: boolean;
      };
    }
  ): Promise<{ superseded: ProjectDecision; superseding: ProjectDecision; originalDecision: ProjectDecision; newDecision: ProjectDecision }> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have authority on this project.'
      );
    }

    if (role !== 'OWNER_CLIENT' && role !== 'SENIOR_PROJECT_DIRECTOR') {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_DECISION_AUTHORITY',
        'Forbidden: Only OWNER_CLIENT or SENIOR_PROJECT_DIRECTOR may supersede project decisions.'
      );
    }

    if (!data.supersededReason || !data.supersededReason.trim()) {
      throw new GovernanceError(
        400,
        'SUPERSEDE_REASON_REQUIRED',
        'A valid reason is required when superseding a project decision.'
      );
    }

    const existingDecision = await this.getDecision(projectId, decisionId, userId);
    if (existingDecision.status !== 'DECIDED' && existingDecision.status !== 'PROPOSED') {
      throw new GovernanceError(
        400,
        'ALREADY_SUPERSEDED',
        `Cannot supersede decision in status ${existingDecision.status}.`
      );
    }

    let supersedingId = data.supersedingDecisionId;
    let createdSuccessor: ProjectDecision | undefined;

    if (!supersedingId && data.newDecision) {
      const nd = data.newDecision;
      createdSuccessor = await this.createDecision(projectId, userId, {
        title: nd.title,
        subject: nd.subject || `Successor: ${existingDecision.subject}`,
        description: nd.description || `Successor decision superseding ${existingDecision.number}`,
        category: nd.category || existingDecision.category,
        options: nd.options || existingDecision.options,
        status: nd.proposeImmediately ? 'PROPOSED' : 'DRAFT',
        decisionAuthorityRole: nd.decisionAuthorityRole || existingDecision.decisionAuthorityRole,
      });
      supersedingId = createdSuccessor.id;
    }

    if (!supersedingId) {
      throw new GovernanceError(
        400,
        'INVALID_SUPERSEDING_DECISION',
        'Superseding decision must be specified or created.'
      );
    }

    const supersedingDecision = createdSuccessor || (await this.getDecision(projectId, supersedingId, userId));
    if (!supersedingDecision || supersedingDecision.projectId !== projectId) {
      throw new GovernanceError(
        400,
        'INVALID_SUPERSEDING_DECISION',
        'Superseding decision must exist on the same project.'
      );
    }

    if (supersedingDecision.id === decisionId) {
      throw new GovernanceError(
        400,
        'SELF_SUPERSEDING_INVALID',
        'A decision cannot supersede itself.'
      );
    }

    const now = new Date().toISOString();

    // 1. Update existing decision to SUPERSEDED
    const updatedSuperseded = await projectDecisionRepository.updateDecision(decisionId, {
      status: 'SUPERSEDED',
      supersededByDecisionId: supersedingDecision.id,
      supersededReason: data.supersededReason.trim(),
      supersededAt: now,
      updatedAt: now,
    });

    // 2. Link replacement in superseding decision
    const updatedSuperseding = await projectDecisionRepository.updateDecision(supersedingDecision.id, {
      supersedesDecisionId: decisionId,
      updatedAt: now,
    });

    if (!updatedSuperseded || !updatedSuperseding) {
      throw new GovernanceError(500, 'SUPERSEDE_FAILED', 'Failed to complete decision supersession');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUserId: userId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'PROJECT_DECISION_SUPERSEDED' as any,
      entityType: 'PROJECT_DECISION',
      entityId: decisionId,
      metadata: {
        number: updatedSuperseded.number,
        supersededByDecisionId: supersedingDecision.id,
        supersededByNumber: updatedSuperseding.number,
        supersededReason: data.supersededReason,
      },
    });

    return {
      superseded: updatedSuperseded,
      superseding: updatedSuperseding,
      originalDecision: updatedSuperseded,
      newDecision: updatedSuperseding,
    };
  }
}

export const projectDecisionService = new ProjectDecisionService();
