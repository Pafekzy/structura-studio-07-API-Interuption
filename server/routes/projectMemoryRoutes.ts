import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { projectMemoryService } from '../services/projectMemoryService';
import { aiMemoryService } from '../services/aiMemoryService';
import {
  queryProjectMemorySchema,
  requestAIMemorySummarySchema,
} from '../validation/schemas';

export const projectMemoryRouter = Router();

// 1. Get Project Memory entries
projectMemoryRouter.get('/projects/:projectId/memory', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = queryProjectMemorySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await projectMemoryService.getProjectMemory(projectId, userId, parsed.data);
    res.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to retrieve project memory',
      code: err.code || 'MEMORY_QUERY_ERROR',
    });
  }
});

// 2. Synthesize AI Project Memory Summary
projectMemoryRouter.post('/projects/:projectId/memory/ai-summary', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = requestAIMemorySummarySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const summary = await aiMemoryService.generateMemorySummary(projectId, userId, parsed.data);
    res.json({ success: true, summary });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to synthesize project memory summary',
      code: err.code || 'MEMORY_SUMMARY_ERROR',
    });
  }
});
