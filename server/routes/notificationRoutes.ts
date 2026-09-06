import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { notificationService } from '../services/notificationService';
import { markNotificationReadSchema } from '../validation/schemas';

export const notificationRouter = Router();

// 1. List user project notifications (recipient-scoped)
notificationRouter.get('/projects/:projectId/notifications', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const notifications = await notificationService.listUserNotifications(projectId, userId);
    res.json({ success: true, notifications });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to list notifications',
      code: err.code || 'NOTIF_LIST_ERROR',
    });
  }
});

// 2. Mark single notification as read (recipient-scoped)
notificationRouter.patch('/projects/:projectId/notifications/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const { projectId, notificationId } = req.params;
    const userId = req.user!.uid;

    const parsed = markNotificationReadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const notification = await notificationService.markAsRead(projectId, notificationId, userId);
    res.json({ success: true, notification });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to mark notification read',
      code: err.code || 'NOTIF_READ_ERROR',
    });
  }
});

// 3. Mark all notifications as read for current user
notificationRouter.post('/projects/:projectId/notifications/mark-all-read', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const result = await notificationService.markAllAsRead(projectId, userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to mark all notifications read',
      code: err.code || 'NOTIF_MARK_ALL_ERROR',
    });
  }
});
