import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { punchItemService } from '../services/punchItemService';
import {
  createPunchItemSchema,
  assignPunchItemSchema,
  submitPunchResolutionSchema,
  verifyPunchItemSchema,
  closePunchItemSchema,
} from '../validation/schemas';

export const punchItemRouter = Router();

// 1. List punch items for a project
punchItemRouter.get('/projects/:projectId/punch-items', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const punchItems = await punchItemService.listPunchItems(projectId, userId);
    res.json({ success: true, punchItems });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to list punch items',
      code: err.code || 'PUNCH_LIST_ERROR',
    });
  }
});

// 2. Get specific punch item
punchItemRouter.get('/projects/:projectId/punch-items/:punchId', requireAuth, async (req, res) => {
  try {
    const { projectId, punchId } = req.params;
    const userId = req.user!.uid;

    const punchItem = await punchItemService.getPunchItemById(projectId, punchId, userId);
    res.json({ success: true, punchItem });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to get punch item',
      code: err.code || 'PUNCH_GET_ERROR',
    });
  }
});

// 3. Create punch item
punchItemRouter.post('/projects/:projectId/punch-items', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = createPunchItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const punchItem = await punchItemService.createPunchItem(projectId, userId, parsed.data as any);
    res.status(201).json({ success: true, punchItem });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to create punch item',
      code: err.code || 'PUNCH_CREATE_ERROR',
    });
  }
});

// 4. Assign punch item
punchItemRouter.patch('/projects/:projectId/punch-items/:punchId/assign', requireAuth, async (req, res) => {
  try {
    const { projectId, punchId } = req.params;
    const userId = req.user!.uid;

    const parsed = assignPunchItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const punchItem = await punchItemService.assignPunchItem(
      projectId,
      punchId,
      userId,
      parsed.data.assignedToUserId
    );
    res.json({ success: true, punchItem });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to assign punch item',
      code: err.code || 'PUNCH_ASSIGN_ERROR',
    });
  }
});

// 5. Submit contractor resolution
punchItemRouter.post('/projects/:projectId/punch-items/:punchId/resolution', requireAuth, async (req, res) => {
  try {
    const { projectId, punchId } = req.params;
    const userId = req.user!.uid;

    const parsed = submitPunchResolutionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const punchItem = await punchItemService.submitResolution(
      projectId,
      punchId,
      userId,
      parsed.data
    );
    res.json({ success: true, punchItem });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to submit resolution',
      code: err.code || 'PUNCH_RESOLUTION_ERROR',
    });
  }
});

// 6. Verify punch item
punchItemRouter.post('/projects/:projectId/punch-items/:punchId/verify', requireAuth, async (req, res) => {
  try {
    const { projectId, punchId } = req.params;
    const userId = req.user!.uid;

    const parsed = verifyPunchItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const punchItem = await punchItemService.verifyPunchItem(
      projectId,
      punchId,
      userId,
      parsed.data
    );
    res.json({ success: true, punchItem });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to verify punch item',
      code: err.code || 'PUNCH_VERIFY_ERROR',
    });
  }
});

// 7. Close punch item
punchItemRouter.post('/projects/:projectId/punch-items/:punchId/close', requireAuth, async (req, res) => {
  try {
    const { projectId, punchId } = req.params;
    const userId = req.user!.uid;

    const parsed = closePunchItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const punchItem = await punchItemService.closePunchItem(
      projectId,
      punchId,
      userId,
      parsed.data.closingNotes
    );
    res.json({ success: true, punchItem });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to close punch item',
      code: err.code || 'PUNCH_CLOSE_ERROR',
    });
  }
});
