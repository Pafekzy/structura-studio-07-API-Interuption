import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { handoverService } from '../services/handoverService';
import {
  prepareHandoverSchema,
  recordHandoverDecisionSchema,
} from '../validation/schemas';

export const handoverRouter = Router();

// 1. Get handover package & readiness evaluation
handoverRouter.get('/projects/:projectId/handover', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const result = await handoverService.getHandover(projectId, userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to get handover package',
      code: err.code || 'HANDOVER_GET_ERROR',
    });
  }
});

// 2. Prepare handover package
handoverRouter.post('/projects/:projectId/handover/prepare', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = prepareHandoverSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const handover = await handoverService.prepareHandover(projectId, userId, parsed.data);
    res.status(201).json({ success: true, handover });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to prepare handover package',
      code: err.code || 'HANDOVER_PREPARE_ERROR',
    });
  }
});

// 3. Submit handover for Owner review
handoverRouter.post('/projects/:projectId/handover/submit-review', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const handover = await handoverService.submitHandoverForReview(projectId, userId);
    res.json({ success: true, handover });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to submit handover for review',
      code: err.code || 'HANDOVER_SUBMIT_ERROR',
    });
  }
});

// 4. Record Owner Handover Decision (Accept / Return)
handoverRouter.post('/projects/:projectId/handover/decision', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = recordHandoverDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    let handover;
    if (parsed.data.decision === 'ACCEPT') {
      handover = await handoverService.acceptHandover(projectId, userId, {
        acceptanceNotes: parsed.data.notes,
      });
    } else {
      handover = await handoverService.returnHandover(projectId, userId, {
        returnReason: parsed.data.notes || 'Returned by Owner for rectification',
      });
    }

    res.json({ success: true, handover });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to record handover decision',
      code: err.code || 'HANDOVER_DECISION_ERROR',
    });
  }
});
