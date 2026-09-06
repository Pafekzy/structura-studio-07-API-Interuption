import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { executiveReportingService } from '../services/executiveReportingService';
import { aiExecutiveBriefingService } from '../services/aiExecutiveBriefingService';
import { requestAIExecutiveBriefingSchema } from '../validation/schemas';

export const executiveReportingRouter = Router();

// 1. Get Executive Project Report & Health Summary
executiveReportingRouter.get('/projects/:projectId/reports/executive', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const report = await executiveReportingService.generateExecutiveReport(projectId, userId);
    res.json({ success: true, report });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to generate executive report',
      code: err.code || 'EXECUTIVE_REPORT_ERROR',
    });
  }
});

// 2. Get Final Project Record Archive Package
executiveReportingRouter.get('/projects/:projectId/reports/final-package', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const packageData = await executiveReportingService.getFinalProjectRecordPackage(projectId, userId);
    res.json({ success: true, package: packageData });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to get final project record package',
      code: err.code || 'FINAL_PACKAGE_ERROR',
    });
  }
});

// 3. Request Grounded AI Executive Briefing
executiveReportingRouter.post('/projects/:projectId/reports/ai-briefing', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = requestAIExecutiveBriefingSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const briefing = await aiExecutiveBriefingService.generateBriefing(
      projectId,
      userId,
      parsed.data
    );
    res.json({ success: true, briefing });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to generate AI executive briefing',
      code: err.code || 'AI_BRIEFING_ERROR',
    });
  }
});
