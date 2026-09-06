import { GoogleGenAI } from '@google/genai';
import { projectMemoryService } from './projectMemoryService';
import { projectRepository } from '../repositories/projectRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { AIMemorySummary, ProjectRecordRef } from '../../src/types';

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export class AIMemoryService {
  async generateMemorySummary(
    projectId: string,
    userId: string,
    options: {
      category?: any;
      milestoneId?: string;
    } = {}
  ): Promise<AIMemorySummary> {
    const role = await projectMemoryService.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw {
        statusCode: 403,
        error: 'Forbidden: You do not have authority to request AI memory summaries for this project.',
        code: 'INSUFFICIENT_PROJECT_AUTHORITY',
      };
    }

    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      throw { statusCode: 404, error: 'Project not found', code: 'PROJECT_NOT_FOUND' };
    }

    const summaryId = `mem-summary-${projectId.slice(-6)}-${Date.now()}`;
    const now = new Date().toISOString();

    // Record request audit event
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUserId: userId,
      projectId,
      organizationId: project.organizationId,
      action: 'PROJECT_MEMORY_SUMMARY_REQUESTED' as any,
      entityType: 'PROJECT_MEMORY_SUMMARY',
      entityId: summaryId,
      metadata: {
        requestedByRole: role,
        milestoneId: options.milestoneId,
      },
    });

    // Retrieve underlying canonical records via projectMemoryService
    const { entries } = await projectMemoryService.getProjectMemory(projectId, userId, {
      category: options.category || 'ALL',
      milestoneId: options.milestoneId,
      limit: 60,
    });

    const sourceRecordRefs: ProjectRecordRef[] = entries.slice(0, 30).map(e => ({
      entityType: e.sourceType,
      entityId: e.sourceId,
      title: e.title,
    }));

    const ai = getAIClient();
    if (!ai) {
      // Truthful unavailable state without fabricating success
      const unavailableResult: AIMemorySummary = {
        summaryId,
        projectId,
        model: 'gemini-3.7-flash',
        generatedAt: now,
        isAiAssisted: false,
        status: 'UNAVAILABLE',
        executiveBriefing: `AI synthesis service unavailable (GEMINI_API_KEY unconfigured). Deterministic record compilation found ${entries.length} persistent project events.`,
        keyMilestoneProgress: entries
          .filter(e => e.sourceType === 'MILESTONE' || e.sourceType === 'SUBMISSION')
          .slice(0, 4)
          .map(e => `${e.title}: ${e.summary}`),
        activeRisksAndBlockers: entries
          .filter(e => e.sourceType === 'NCR' && e.resultingState !== 'CLOSED')
          .slice(0, 3)
          .map(e => `${e.title}: ${e.summary}`),
        pendingDecisionsAndActions: entries
          .filter(e => e.sourceType === 'PROJECT_DECISION' && e.resultingState === 'PROPOSED')
          .slice(0, 3)
          .map(e => `${e.title}: ${e.summary}`),
        referencedSourcesCount: entries.length,
        sourceRecordRefs,
        disclaimer: 'AI inference unavailable. Deterministic compilation presented. All governance decisions require human professional verification.',
        errorMessage: 'GEMINI_API_KEY environment variable is not configured.',
      };

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorUserId: userId,
        projectId,
        organizationId: project.organizationId,
        action: 'PROJECT_MEMORY_SUMMARY_FAILED' as any,
        entityType: 'PROJECT_MEMORY_SUMMARY',
        entityId: summaryId,
        metadata: {
          reason: 'API_KEY_NOT_CONFIGURED',
        },
      });

      return unavailableResult;
    }

    try {
      const prompt = `You are Structura AI, an authoritative Construction Governance & Project Memory Analyst.
Synthesize the official Project Memory briefing strictly based on the following verified persistent project records.
Do NOT fabricate events, approvals, payments, or inspections that are not in the records.

Project Context:
- Project: ${project.name}
- Stage: ${project.currentStage}
- Location: ${project.location}
- Baseline Budget USD: $${project.totalBaselineBudgetUSD.toLocaleString()}

Persistent Canonical Project Records (${entries.length} events):
${JSON.stringify(
  entries.map(e => ({
    timestamp: e.timestamp,
    type: e.sourceType,
    title: e.title,
    actor: `${e.actorName} (${e.actorRole})`,
    state: e.resultingState,
    summary: e.summary,
  })),
  null,
  2
)}

Return a JSON object strictly matching this schema:
{
  "executiveBriefing": "A 2-3 paragraph objective executive briefing summarizing current site momentum, governance state, verified inspections, and unresolved items.",
  "keyMilestoneProgress": ["3-5 clear bullet points of milestone submissions, reviews, and progress."],
  "activeRisksAndBlockers": ["Identified open NCRs, technical clarification holds, or critical issues."],
  "pendingDecisionsAndActions": ["Pending proposed project decisions, owner approvals, or re-inspections required."]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      if (!response.text) {
        throw new Error('Empty response received from Gemini model.');
      }

      const parsed = JSON.parse(response.text);

      const result: AIMemorySummary = {
        summaryId,
        projectId,
        model: 'gemini-3.7-flash',
        generatedAt: new Date().toISOString(),
        isAiAssisted: true,
        status: 'COMPLETED',
        executiveBriefing: parsed.executiveBriefing || 'Executive briefing compiled.',
        keyMilestoneProgress: parsed.keyMilestoneProgress || [],
        activeRisksAndBlockers: parsed.activeRisksAndBlockers || [],
        pendingDecisionsAndActions: parsed.pendingDecisionsAndActions || [],
        referencedSourcesCount: entries.length,
        sourceRecordRefs,
        disclaimer: 'AI-assisted project memory synthesis grounded in persisted project records. All formal engineering, contractual, and financial authorizations require designated professional execution.',
      };

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorUserId: userId,
        projectId,
        organizationId: project.organizationId,
        action: 'PROJECT_MEMORY_SUMMARY_COMPLETED' as any,
        entityType: 'PROJECT_MEMORY_SUMMARY',
        entityId: summaryId,
        metadata: {
          referencedSourcesCount: entries.length,
          model: 'gemini-3.7-flash',
        },
      });

      return result;
    } catch (err: any) {
      console.warn('[AIMemoryService] Gemini inference failed, returning truthful failure status:', err);

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorUserId: userId,
        projectId,
        organizationId: project.organizationId,
        action: 'PROJECT_MEMORY_SUMMARY_FAILED' as any,
        entityType: 'PROJECT_MEMORY_SUMMARY',
        entityId: summaryId,
        metadata: {
          error: err?.message || 'Model execution error',
        },
      });

      return {
        summaryId,
        projectId,
        model: 'gemini-3.7-flash',
        generatedAt: new Date().toISOString(),
        isAiAssisted: false,
        status: 'FAILED',
        executiveBriefing: `AI synthesis encountered an error during inference. Underlying canonical records (${entries.length} events) remain intact. Human review required.`,
        keyMilestoneProgress: [],
        activeRisksAndBlockers: [],
        pendingDecisionsAndActions: [],
        referencedSourcesCount: entries.length,
        sourceRecordRefs,
        disclaimer: 'AI inference failed. Canonical records preserved. Requires manual project director review and professional verification.',
        errorMessage: err?.message || 'Gemini inference failed',
      };
    }
  }
}

export const aiMemoryService = new AIMemoryService();
