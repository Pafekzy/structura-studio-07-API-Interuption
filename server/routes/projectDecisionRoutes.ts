import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { projectDecisionService } from '../services/projectDecisionService';
import { notificationService } from '../services/notificationService';
import {
  createProjectDecisionSchema,
  proposeProjectDecisionSchema,
  recordDecisionOutcomeSchema,
  supersedeDecisionSchema,
} from '../validation/schemas';

export const projectDecisionRouter = Router();

// 1. List project decisions
projectDecisionRouter.get('/projects/:projectId/decisions', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const decisions = await projectDecisionService.listDecisions(projectId, userId);
    res.json({ success: true, decisions });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to list project decisions',
      code: err.code || 'DECISION_LIST_ERROR',
    });
  }
});

// 2. Create a new project decision
projectDecisionRouter.post('/projects/:projectId/decisions', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user!.uid;

    const parsed = createProjectDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const decision = await projectDecisionService.createDecision(projectId, userId, parsed.data);

    // Notify project leadership if proposed immediately
    if (decision.status === 'PROPOSED') {
      notificationService.notifyRoles(
        projectId,
        ['OWNER_CLIENT', 'SENIOR_PROJECT_DIRECTOR'],
        {
          type: 'PROJECT_DECISION_PROPOSED',
          title: `Project Decision Proposed: ${decision.number}`,
          message: `${decision.proposedByName} proposed decision "${decision.title}". Governance review required.`,
          severity: 'ACTION_REQUIRED',
          relatedRecordType: 'PROJECT_DECISION',
          relatedRecordId: decision.id,
          excludeUserId: userId,
        }
      ).catch(e => console.warn('Notification dispatch warning:', e));
    }

    res.status(201).json({ success: true, decision });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to create project decision',
      code: err.code || 'DECISION_CREATE_ERROR',
    });
  }
});

// 3. Get single project decision
projectDecisionRouter.get('/projects/:projectId/decisions/:decisionId', requireAuth, async (req, res) => {
  try {
    const { projectId, decisionId } = req.params;
    const userId = req.user!.uid;

    const decision = await projectDecisionService.getDecision(projectId, decisionId, userId);
    res.json({ success: true, decision });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to get project decision',
      code: err.code || 'DECISION_GET_ERROR',
    });
  }
});

// 4. Propose draft project decision
projectDecisionRouter.post('/projects/:projectId/decisions/:decisionId/propose', requireAuth, async (req, res) => {
  try {
    const { projectId, decisionId } = req.params;
    const userId = req.user!.uid;

    const parsed = proposeProjectDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const decision = await projectDecisionService.proposeDecision(projectId, decisionId, userId, parsed.data.rationale);

    notificationService.notifyRoles(
      projectId,
      ['OWNER_CLIENT', 'SENIOR_PROJECT_DIRECTOR'],
      {
        type: 'PROJECT_DECISION_PROPOSED',
        title: `Project Decision Proposed: ${decision.number}`,
        message: `${decision.proposedByName} proposed decision "${decision.title}". Review required.`,
        severity: 'ACTION_REQUIRED',
        relatedRecordType: 'PROJECT_DECISION',
        relatedRecordId: decision.id,
        excludeUserId: userId,
      }
    ).catch(e => console.warn('Notification dispatch warning:', e));

    res.json({ success: true, decision });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to propose project decision',
      code: err.code || 'DECISION_PROPOSE_ERROR',
    });
  }
});

// 5. Record official decision outcome
projectDecisionRouter.post('/projects/:projectId/decisions/:decisionId/outcome', requireAuth, async (req, res) => {
  try {
    const { projectId, decisionId } = req.params;
    const userId = req.user!.uid;

    const parsed = recordDecisionOutcomeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const decision = await projectDecisionService.recordDecisionOutcome(projectId, decisionId, userId, parsed.data);

    // Notify project appointments of decided outcome
    notificationService.notifyRoles(
      projectId,
      ['OWNER_CLIENT', 'SENIOR_PROJECT_DIRECTOR', 'GENERAL_CONTRACTOR', 'STRUCTURAL_QA_QC_AUDITOR'],
      {
        type: 'PROJECT_DECISION_DECIDED',
        title: `Decision Recorded: ${decision.number}`,
        message: `${decision.decisionAuthorityName} (${decision.decisionAuthorityRole}) recorded decision for "${decision.title}". Outcome: ${decision.selectedOutcome}`,
        severity: 'INFO',
        relatedRecordType: 'PROJECT_DECISION',
        relatedRecordId: decision.id,
        excludeUserId: userId,
      }
    ).catch(e => console.warn('Notification dispatch warning:', e));

    res.json({ success: true, decision });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to record decision outcome',
      code: err.code || 'DECISION_OUTCOME_ERROR',
    });
  }
});

// 6. Supersede decision
projectDecisionRouter.post('/projects/:projectId/decisions/:decisionId/supersede', requireAuth, async (req, res) => {
  try {
    const { projectId, decisionId } = req.params;
    const userId = req.user!.uid;

    const parsed = supersedeDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues,
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await projectDecisionService.supersedeDecision(projectId, decisionId, userId, parsed.data);

    notificationService.notifyRoles(
      projectId,
      ['OWNER_CLIENT', 'SENIOR_PROJECT_DIRECTOR', 'GENERAL_CONTRACTOR', 'STRUCTURAL_QA_QC_AUDITOR'],
      {
        type: 'PROJECT_DECISION_SUPERSEDED',
        title: `Decision Superseded: ${result.superseded.number}`,
        message: `${result.superseded.number} has been superseded by ${result.superseding.number}. Reason: ${parsed.data.supersededReason}`,
        severity: 'WARNING',
        relatedRecordType: 'PROJECT_DECISION',
        relatedRecordId: result.superseded.id,
        excludeUserId: userId,
      }
    ).catch(e => console.warn('Notification dispatch warning:', e));

    res.json({ success: true, ...result });
  } catch (err: any) {
    const status = err.statusCode || 500;
    res.status(status).json({
      error: err.error || err.message || 'Failed to supersede project decision',
      code: err.code || 'DECISION_SUPERSEDE_ERROR',
    });
  }
});
