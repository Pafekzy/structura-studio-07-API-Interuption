import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { closeoutService } from '../services/closeoutService';
import {
  initiateCloseoutSchema,
  updateCloseoutChecklistItemSchema,
  completeCloseoutSchema,
  returnCloseoutSchema,
} from '../validation/schemas';

export const closeoutRouter = Router();

// 1. Get closeout dossier & gate evaluation for project
closeoutRouter.get('/projects/:projectId/closeout', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const result = await closeoutService.getCloseout(projectId, userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to get closeout dossier',
      code: err.code || 'CLOSEOUT_GET_ERROR',
    });
  }
});

// 2. Initiate formal closeout
closeoutRouter.post('/projects/:projectId/closeout/initiate', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const closeout = await closeoutService.startCloseout(projectId, userId);
    res.status(201).json({ success: true, closeout });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to initiate closeout',
      code: err.code || 'CLOSEOUT_INITIATE_ERROR',
    });
  }
});

// 3. Update checklist item
closeoutRouter.patch('/projects/:projectId/closeout/items/:itemId', requireAuth, async (req, res) => {
  try {
    const { projectId, itemId } = req.params;
    const userId = req.user!.uid;

    const parsed = updateCloseoutChecklistItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const closeout = await closeoutService.updateChecklistItem(
      projectId,
      itemId,
      userId,
      parsed.data
    );
    res.json({ success: true, closeout });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to update closeout item',
      code: err.code || 'CLOSEOUT_ITEM_UPDATE_ERROR',
    });
  }
});

// 4. Submit closeout for review
closeoutRouter.post('/projects/:projectId/closeout/submit-review', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const closeout = await closeoutService.submitCloseoutForReview(projectId, userId);
    res.json({ success: true, closeout });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to submit closeout for review',
      code: err.code || 'CLOSEOUT_SUBMIT_REVIEW_ERROR',
    });
  }
});

// 5. Complete closeout (Enforces prerequisite gates)
closeoutRouter.post('/projects/:projectId/closeout/complete', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = completeCloseoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const closeout = await closeoutService.completeCloseout(projectId, userId, parsed.data as any);
    res.json({ success: true, closeout });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to complete closeout',
      code: err.code || 'CLOSEOUT_COMPLETE_ERROR',
    });
  }
});

// 6. Return closeout for rework
closeoutRouter.post('/projects/:projectId/closeout/return', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = returnCloseoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const closeout = await closeoutService.returnCloseout(projectId, userId, parsed.data);
    res.json({ success: true, closeout });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to return closeout',
      code: err.code || 'CLOSEOUT_RETURN_ERROR',
    });
  }
});
