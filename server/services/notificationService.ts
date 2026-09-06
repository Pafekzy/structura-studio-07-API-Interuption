import { projectRepository, ProjectRole } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { GovernanceError } from './governanceError';
import {
  ProjectNotification,
  NotificationType,
  NotificationSeverity,
} from '../../src/types';

export class NotificationService {
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

  // ==========================================
  // Recipient Scoped Queries
  // ==========================================

  async listUserNotifications(projectId: string, authenticatedUserId: string): Promise<ProjectNotification[]> {
    const role = await this.resolveUserProjectRole(projectId, authenticatedUserId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have authority to view notifications for this project.'
      );
    }

    return notificationRepository.listNotificationsByRecipient(projectId, authenticatedUserId);
  }

  async getUserNotifications(projectId: string, authenticatedUserId: string): Promise<{ notifications: ProjectNotification[]; unreadCount: number }> {
    const notifications = await this.listUserNotifications(projectId, authenticatedUserId);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    return { notifications, unreadCount };
  }

  async markAsRead(projectId: string, notificationId: string, authenticatedUserId: string): Promise<ProjectNotification> {
    const role = await this.resolveUserProjectRole(projectId, authenticatedUserId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have authority on this project.'
      );
    }

    const notification = await notificationRepository.getNotificationById(notificationId);
    if (!notification || notification.projectId !== projectId) {
      throw new GovernanceError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found for this project.');
    }

    // Recipient-scoping: user can only mutate their own notifications
    if (notification.recipientUserId !== authenticatedUserId) {
      throw new GovernanceError(
        403,
        'FORBIDDEN_RECIPIENT_MISMATCH',
        'Forbidden: You cannot modify notifications belonging to another recipient.'
      );
    }

    const updated = await notificationRepository.markAsRead(notificationId);
    if (!updated) {
      throw new GovernanceError(500, 'UPDATE_FAILED', 'Failed to mark notification read');
    }

    const project = await projectRepository.getProjectById(projectId);
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUserId: authenticatedUserId,
      projectId,
      organizationId: project?.organizationId || 'org-structura-demo',
      action: 'NOTIFICATION_READ' as any,
      entityType: 'NOTIFICATION',
      entityId: notificationId,
      metadata: {
        type: updated.type,
        title: updated.title,
      },
    });

    return updated;
  }

  async markAllAsRead(projectId: string, authenticatedUserId: string): Promise<{ count: number }> {
    const role = await this.resolveUserProjectRole(projectId, authenticatedUserId);
    if (!role) {
      throw new GovernanceError(
        403,
        'INSUFFICIENT_PROJECT_AUTHORITY',
        'Forbidden: You do not have authority on this project.'
      );
    }

    const count = await notificationRepository.markAllAsRead(projectId, authenticatedUserId);
    return { count };
  }

  // ==========================================
  // Internal Event Notification Dispatchers
  // ==========================================

  async sendNotification(data: {
    projectId: string;
    recipientUserId: string;
    recipientRole?: ProjectRole;
    type: NotificationType;
    title: string;
    message: string;
    severity: NotificationSeverity;
    relatedRecordType?: string;
    relatedRecordId?: string;
  }): Promise<ProjectNotification> {
    const project = await projectRepository.getProjectById(data.projectId);
    const id = `notif-${data.projectId.slice(-6)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const notif: ProjectNotification = {
      id,
      projectId: data.projectId,
      recipientUserId: data.recipientUserId,
      recipientRole: data.recipientRole,
      type: data.type,
      title: (data.title || '').trim(),
      message: (data.message || '').trim(),
      severity: data.severity,
      relatedRecordType: data.relatedRecordType,
      relatedRecordId: data.relatedRecordId,
      isRead: false,
      createdAt: now,
      isDemo: project?.isDemo,
    };

    return notificationRepository.createNotification(notif);
  }

  /**
   * Dispatches notifications to all active appointments matching designated roles.
   * Supports both object payload and positional arguments.
   */
  async notifyRoles(
    projectId: string,
    roles: ProjectRole[],
    dataOrType:
      | NotificationType
      | {
          type: NotificationType;
          title: string;
          message: string;
          severity: NotificationSeverity;
          relatedRecordType?: string;
          relatedRecordId?: string;
          excludeUserId?: string;
        },
    argTitle?: string,
    argMessage?: string,
    argSeverity?: NotificationSeverity,
    argActorUserId?: string,
    argOptions?: {
      relatedRecordType?: string;
      relatedRecordId?: string;
      excludeUserId?: string;
    }
  ): Promise<void> {
    let payload: {
      type: NotificationType;
      title: string;
      message: string;
      severity: NotificationSeverity;
      relatedRecordType?: string;
      relatedRecordId?: string;
      excludeUserId?: string;
    };

    if (typeof dataOrType === 'string') {
      payload = {
        type: dataOrType,
        title: argTitle || '',
        message: argMessage || '',
        severity: argSeverity || 'INFO',
        relatedRecordType: argOptions?.relatedRecordType,
        relatedRecordId: argOptions?.relatedRecordId,
        excludeUserId: argOptions?.excludeUserId,
      };
    } else {
      payload = dataOrType;
    }

    const appointments = await projectRepository.listAppointmentsByProject(projectId);
    const activeAppts = appointments.filter(a => a.appointmentStatus === 'ACTIVE' && roles.includes(a.role));

    // Also include project owner if OWNER_CLIENT is in target roles
    const project = await projectRepository.getProjectById(projectId);
    if (project && roles.includes('OWNER_CLIENT') && project.ownerUserId !== payload.excludeUserId) {
      if (!activeAppts.some(a => a.userId === project.ownerUserId)) {
        await this.sendNotification({
          projectId,
          recipientUserId: project.ownerUserId,
          recipientRole: 'OWNER_CLIENT',
          type: payload.type,
          title: payload.title,
          message: payload.message,
          severity: payload.severity,
          relatedRecordType: payload.relatedRecordType,
          relatedRecordId: payload.relatedRecordId,
        });
      }
    }

    for (const appt of activeAppts) {
      if (payload.excludeUserId && appt.userId === payload.excludeUserId) continue;
      await this.sendNotification({
        projectId,
        recipientUserId: appt.userId,
        recipientRole: appt.role,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        severity: payload.severity,
        relatedRecordType: payload.relatedRecordType,
        relatedRecordId: payload.relatedRecordId,
      });
    }
  }
}

export const notificationService = new NotificationService();
