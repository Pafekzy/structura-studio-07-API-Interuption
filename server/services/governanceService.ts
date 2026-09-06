import crypto from 'crypto';
import { 
  organizationRepository, 
  Organization, 
  OrganizationType, 
  OrganizationMembership 
} from '../repositories/organizationRepository';
import { 
  projectRepository, 
  StoredProject, 
  ProjectAppointment, 
  ProjectRole 
} from '../repositories/projectRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { userRepository, PrimaryRole } from '../repositories/userRepository';

export interface CreateOrganizationInput {
  name: string;
  type: OrganizationType;
  jurisdiction: string;
  country: string;
  registrationNumber?: string;
  address?: string;
}

export interface CreateProjectInput {
  name: string;
  location: string;
  projectType?: string;
  description?: string;
  startDate: string;
  targetHandoverDate: string;
  totalBaselineBudgetUSD: number;
  currency?: string;
  currentStage?: string;
}

export interface GovernanceSlot {
  role: ProjectRole;
  roleTitle: string;
  status: 'UNASSIGNED' | 'INVITED' | 'ACTIVE';
  appointment?: ProjectAppointment;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    verificationStatus: string;
    experienceYears?: number;
    discipline?: string;
    professionalBody?: string;
  };
}

export class GovernanceService {
  // 1. Create Organization (B1, B2, B3, B4)
  async createOrganization(actorUserId: string, input: CreateOrganizationInput): Promise<{ organization: Organization; membership: OrganizationMembership }> {
    const actor = await userRepository.findByAuthUserId(actorUserId);
    if (!actor) {
      throw new Error('Actor profile not found.');
    }

    const orgId = `org_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    // Truth in Governance: Status is initialized to NOT_STARTED. Never fabricate verified state.
    const newOrg: Organization = {
      id: orgId,
      name: input.name.trim(),
      type: input.type,
      registrationNumber: input.registrationNumber?.trim() || '',
      jurisdiction: input.jurisdiction.trim(),
      country: input.country.trim(),
      address: input.address?.trim() || '',
      createdByUserId: actorUserId,
      ownerUserId: actorUserId,
      verificationStatus: 'NOT_STARTED',
      ownerAuthorityStatus: 'NOT_STARTED',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const savedOrg = await organizationRepository.createOrganization(newOrg);

    // Creator becomes founding OWNER_ADMIN
    const membership: OrganizationMembership = {
      id: `mem_${crypto.randomUUID().substring(0, 8)}`,
      organizationId: orgId,
      userId: actorUserId,
      organizationRole: 'OWNER_ADMIN',
      status: 'ACTIVE',
      createdAt: now,
    };
    const savedMembership = await organizationRepository.createMembership(membership);

    // Log server-side audit event
    await auditEventRepository.record({
      id: `audit_${crypto.randomUUID()}`,
      actorUserId,
      organizationId: orgId,
      action: 'ORGANIZATION_CREATED',
      entityType: 'ORGANIZATION',
      entityId: orgId,
      timestamp: now,
      metadata: { name: savedOrg.name, type: savedOrg.type },
    });

    return { organization: savedOrg, membership: savedMembership };
  }

  async getOrganization(organizationId: string): Promise<Organization | null> {
    return organizationRepository.getOrganizationById(organizationId);
  }

  async listUserOrganizations(userId: string): Promise<Organization[]> {
    return organizationRepository.listOrganizationsByUser(userId);
  }

  // 2. Create Project under Organization (Part C)
  async createProject(actorUserId: string, organizationId: string, input: CreateProjectInput): Promise<StoredProject> {
    const org = await organizationRepository.getOrganizationById(organizationId);
    if (!org) {
      throw new Error('Organization not found.');
    }

    // Check actor membership
    const membership = await organizationRepository.getMembership(organizationId, actorUserId);
    if (!membership || membership.organizationRole !== 'OWNER_ADMIN' || membership.status !== 'ACTIVE') {
      if (org.ownerUserId !== actorUserId) {
        throw new Error('Unauthorized: Only an OWNER_ADMIN of the organization may create projects.');
      }
    }

    const projectId = `proj_${crypto.randomUUID().substring(0, 8)}`;
    const now = new Date().toISOString();

    const newProject: StoredProject = {
      id: projectId,
      organizationId,
      name: input.name.trim(),
      location: input.location.trim(),
      projectType: input.projectType || 'Commercial Mixed-Use',
      description: input.description || '',
      startDate: input.startDate,
      targetHandoverDate: input.targetHandoverDate,
      totalBaselineBudgetUSD: Number(input.totalBaselineBudgetUSD) || 0,
      currency: input.currency || 'USD',
      currentStage: input.currentStage || 'Planning & Feasibility',
      ownerUserId: actorUserId,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const savedProject = await projectRepository.createProject(newProject);

    // Automatically appoint Owner / Client as ACTIVE
    const ownerActor = await userRepository.findByAuthUserId(actorUserId);
    const ownerName = ownerActor ? `${ownerActor.firstName} ${ownerActor.lastName}` : 'Owner / Client';
    const ownerEmail = ownerActor?.email || '';

    await projectRepository.createAppointment({
      id: `appt_${crypto.randomUUID().substring(0, 8)}`,
      projectId,
      organizationId,
      userId: actorUserId,
      userEmail: ownerEmail,
      userName: ownerName,
      role: 'OWNER_CLIENT',
      appointmentStatus: 'ACTIVE',
      invitedByUserId: actorUserId,
      invitedAt: now,
      activatedAt: now,
    });

    // Record Audit Event
    await auditEventRepository.record({
      id: `audit_${crypto.randomUUID()}`,
      actorUserId,
      organizationId,
      projectId,
      action: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: projectId,
      timestamp: now,
      metadata: { projectName: savedProject.name, budgetUSD: savedProject.totalBaselineBudgetUSD },
    });

    return savedProject;
  }

  async listProjectsByOrganization(organizationId: string): Promise<StoredProject[]> {
    return projectRepository.listProjectsByOrg(organizationId);
  }

  async listProjectsByUser(userId: string): Promise<StoredProject[]> {
    return projectRepository.listProjectsByUser(userId);
  }

  async getProject(projectId: string): Promise<StoredProject | null> {
    return projectRepository.getProjectById(projectId);
  }

  // 3. Project Governance Slots & Vacancies (Part D & E)
  async getProjectGovernance(projectId: string): Promise<{ project: StoredProject; team: GovernanceSlot[] }> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found.`);
    }

    const appointments = await projectRepository.listAppointmentsByProject(projectId);

    const rolesOrder: Array<{ role: ProjectRole; title: string }> = [
      { role: 'OWNER_CLIENT', title: 'Owner / Client' },
      { role: 'SENIOR_PROJECT_DIRECTOR', title: 'Senior Project Director' },
      { role: 'GENERAL_CONTRACTOR', title: 'General Contractor' },
      { role: 'STRUCTURAL_QA_QC_AUDITOR', title: 'Structural QA/QC Auditor' },
    ];

    const team: GovernanceSlot[] = [];

    for (const item of rolesOrder) {
      // Find active or invited appointment for this role
      const appt = appointments.find(
        a => a.role === item.role && (a.appointmentStatus === 'ACTIVE' || a.appointmentStatus === 'INVITED')
      );

      if (!appt) {
        team.push({
          role: item.role,
          roleTitle: item.title,
          status: 'UNASSIGNED',
        });
      } else {
        const user = await userRepository.findByAuthUserId(appt.userId);
        team.push({
          role: item.role,
          roleTitle: item.title,
          status: appt.appointmentStatus === 'ACTIVE' ? 'ACTIVE' : 'INVITED',
          appointment: appt,
          assignedUser: user ? {
            id: user.authUserId,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            verificationStatus: user.professionalVerificationStatus,
            experienceYears: user.roleDetails?.yearsExperience,
            discipline: user.roleDetails?.primaryDiscipline,
            professionalBody: user.roleDetails?.professionalBody,
          } : undefined,
        });
      }
    }

    return { project, team };
  }

  // 4. Professional Discovery Directory (Part F)
  async discoverProfessionals(role: ProjectRole, search?: string, country?: string): Promise<any[]> {
    const allUsers = await userRepository.listAll();
    
    // Convert project role to primary role
    const matchingUsers = allUsers.filter(u => {
      if (u.primaryRole !== role) return false;
      if (search) {
        const q = search.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const discipline = (u.roleDetails?.primaryDiscipline || '').toLowerCase();
        const company = (u.roleDetails?.companyName || '').toLowerCase();
        if (!fullName.includes(q) && !discipline.includes(q) && !company.includes(q)) {
          return false;
        }
      }
      if (country && u.roleDetails?.country) {
        if (u.roleDetails.country.toLowerCase() !== country.toLowerCase()) {
          return false;
        }
      }
      return true;
    });

    return matchingUsers.map(u => ({
      id: u.authUserId,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      primaryRole: u.primaryRole,
      // Truthful verification status: UNVERIFIED unless explicitly verified by legal workflow
      verificationDisplay: u.professionalVerificationStatus === 'VERIFIED' 
        ? 'VERIFIED' 
        : u.professionalVerificationStatus === 'PENDING'
          ? 'PENDING VERIFICATION'
          : 'UNVERIFIED — PENDING AUDIT',
      professionalVerificationStatus: u.professionalVerificationStatus,
      identityStatus: u.identityStatus,
      roleDetails: u.roleDetails || {},
    }));
  }

  // 5. Send Project Governance Invitation (Part G & H)
  async inviteProfessional(
    actorUserId: string,
    projectId: string,
    professionalUserId: string,
    role: ProjectRole,
    reason?: string
  ): Promise<ProjectAppointment> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    // Verify actor is the project owner
    if (project.ownerUserId !== actorUserId) {
      const org = await organizationRepository.getOrganizationById(project.organizationId);
      if (!org || org.ownerUserId !== actorUserId) {
        throw new Error('Unauthorized: Only the project Owner / Client can issue governance appointments.');
      }
    }

    // Find candidate professional user
    const professional = await userRepository.findByAuthUserId(professionalUserId);
    if (!professional) {
      throw new Error('Target professional profile not found.');
    }

    // CRITICAL GOVERNANCE RULE: A user's primaryRole must match the role they are appointed to!
    if (professional.primaryRole !== role) {
      throw new Error(
        `Role Mismatch: Candidate primary role is ${professional.primaryRole}, which cannot be appointed as ${role}.`
      );
    }

    // Check if slot is already occupied
    const existing = await projectRepository.listAppointmentsByProject(projectId);
    const occupied = existing.find(
      a => a.role === role && (a.appointmentStatus === 'ACTIVE' || a.appointmentStatus === 'INVITED')
    );
    if (occupied) {
      throw new Error(`The role ${role} already has an ${occupied.appointmentStatus.toLowerCase()} appointment on this project.`);
    }

    const now = new Date().toISOString();
    const appointmentId = `appt_${crypto.randomUUID().substring(0, 8)}`;
    
    // Status MUST be INVITED - never automatically active
    const newAppointment: ProjectAppointment = {
      id: appointmentId,
      projectId,
      organizationId: project.organizationId,
      userId: professionalUserId,
      userEmail: professional.email,
      userName: `${professional.firstName} ${professional.lastName}`,
      role,
      appointmentStatus: 'INVITED',
      invitedByUserId: actorUserId,
      invitedAt: now,
      reason: reason?.trim() || '',
    };

    const saved = await projectRepository.createAppointment(newAppointment);

    // Audit Event
    await auditEventRepository.record({
      id: `audit_${crypto.randomUUID()}`,
      actorUserId,
      organizationId: project.organizationId,
      projectId,
      action: 'PROJECT_INVITATION_SENT',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      timestamp: now,
      metadata: { 
        candidateEmail: professional.email, 
        role, 
        projectName: project.name 
      },
    });

    return saved;
  }

  // 6. List invitations pending for a user
  async listUserInvitations(userId: string): Promise<any[]> {
    const appointments = await projectRepository.listAppointmentsByUser(userId);
    const pending = appointments.filter(a => a.appointmentStatus === 'INVITED');

    const enriched = [];
    for (const appt of pending) {
      const project = await projectRepository.getProjectById(appt.projectId);
      const org = project ? await organizationRepository.getOrganizationById(project.organizationId) : null;
      const inviter = await userRepository.findByAuthUserId(appt.invitedByUserId);

      enriched.push({
        ...appt,
        projectName: project?.name || 'Unknown Project',
        projectLocation: project?.location || '',
        organizationName: org?.name || 'Unknown Organization',
        invitedByName: inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Project Owner',
      });
    }

    return enriched;
  }

  // 7. Accept or Decline Invitation (Part G)
  async respondToInvitation(userId: string, appointmentId: string, accept: boolean): Promise<ProjectAppointment> {
    const appt = await projectRepository.getAppointmentById(appointmentId);
    if (!appt) {
      throw new Error('Appointment invitation not found.');
    }

    if (appt.userId !== userId) {
      throw new Error('Unauthorized: This invitation was addressed to a different professional.');
    }

    if (appt.appointmentStatus !== 'INVITED') {
      throw new Error(`Invitation cannot be processed: current status is ${appt.appointmentStatus}.`);
    }

    const now = new Date().toISOString();

    if (accept) {
      const updated = await projectRepository.updateAppointment(appointmentId, {
        appointmentStatus: 'ACTIVE',
        respondedAt: now,
        activatedAt: now,
      });

      await auditEventRepository.record({
        id: `audit_${crypto.randomUUID()}`,
        actorUserId: userId,
        organizationId: appt.organizationId,
        projectId: appt.projectId,
        action: 'PROJECT_INVITATION_ACCEPTED',
        entityType: 'APPOINTMENT',
        entityId: appointmentId,
        timestamp: now,
        metadata: { role: appt.role },
      });

      return updated!;
    } else {
      const updated = await projectRepository.updateAppointment(appointmentId, {
        appointmentStatus: 'DECLINED',
        respondedAt: now,
      });

      await auditEventRepository.record({
        id: `audit_${crypto.randomUUID()}`,
        actorUserId: userId,
        organizationId: appt.organizationId,
        projectId: appt.projectId,
        action: 'PROJECT_INVITATION_DECLINED',
        entityType: 'APPOINTMENT',
        entityId: appointmentId,
        timestamp: now,
        metadata: { role: appt.role },
      });

      return updated!;
    }
  }

  // 8. Revoke Appointment
  async revokeAppointment(actorUserId: string, projectId: string, appointmentId: string, reason?: string): Promise<ProjectAppointment> {
    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    if (project.ownerUserId !== actorUserId) {
      throw new Error('Unauthorized: Only the project owner may revoke an appointment.');
    }

    const appt = await projectRepository.getAppointmentById(appointmentId);
    if (!appt || appt.projectId !== projectId) {
      throw new Error('Appointment not found on this project.');
    }

    const now = new Date().toISOString();
    const updated = await projectRepository.updateAppointment(appointmentId, {
      appointmentStatus: 'REVOKED',
      endedAt: now,
      reason: reason || 'Revoked by Project Owner',
    });

    await auditEventRepository.record({
      id: `audit_${crypto.randomUUID()}`,
      actorUserId,
      organizationId: project.organizationId,
      projectId,
      action: 'PROJECT_APPOINTMENT_REVOKED',
      entityType: 'APPOINTMENT',
      entityId: appointmentId,
      timestamp: now,
      metadata: { role: appt.role, revokedUserId: appt.userId },
    });

    return updated!;
  }
}

export const governanceService = new GovernanceService();
