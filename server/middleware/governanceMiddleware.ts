import { Request, Response, NextFunction } from 'express';
import { organizationRepository } from '../repositories/organizationRepository';
import { projectRepository, ProjectRole } from '../repositories/projectRepository';

export async function requireOrganizationOwner(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  const organizationId = req.params.organizationId || req.body.organizationId;
  if (!organizationId) {
    return res.status(400).json({ error: 'organizationId is required', code: 'MISSING_ORG_ID' });
  }

  const org = await organizationRepository.getOrganizationById(organizationId);
  if (!org) {
    return res.status(404).json({ error: 'Organization not found', code: 'ORG_NOT_FOUND' });
  }

  const membership = await organizationRepository.getMembership(organizationId, user.uid);
  const isOwner = org.ownerUserId === user.uid || (membership && membership.organizationRole === 'OWNER_ADMIN' && membership.status === 'ACTIVE');

  if (!isOwner) {
    return res.status(403).json({
      error: 'Forbidden: Only an Owner / OWNER_ADMIN of this organization may perform this action.',
      code: 'INSUFFICIENT_ORG_AUTHORITY',
    });
  }

  return next();
}

export async function requireProjectOwner(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }

  const projectId = req.params.projectId || req.body.projectId;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required', code: 'MISSING_PROJECT_ID' });
  }

  const project = await projectRepository.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found', code: 'PROJECT_NOT_FOUND' });
  }

  if (project.ownerUserId !== user.uid) {
    return res.status(403).json({
      error: 'Forbidden: Only the Owner / Client of this project can manage governance appointments.',
      code: 'NOT_PROJECT_OWNER',
    });
  }

  return next();
}

export function requireProjectRole(allowedRoles: ProjectRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }

    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required', code: 'MISSING_PROJECT_ID' });
    }

    const appointment = await projectRepository.getAppointmentByProjectAndUser(projectId, user.uid);
    if (!appointment || appointment.appointmentStatus !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Forbidden: You do not have an active appointment on this project.',
        code: 'NO_ACTIVE_APPOINTMENT',
      });
    }

    if (!allowedRoles.includes(appointment.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of roles [${allowedRoles.join(', ')}]. Your active role is ${appointment.role}.`,
        code: 'INSUFFICIENT_PROJECT_ROLE',
      });
    }

    return next();
  };
}
