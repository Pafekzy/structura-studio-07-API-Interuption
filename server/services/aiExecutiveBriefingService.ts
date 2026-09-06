import { GoogleGenAI } from '@google/genai';
import { projectRepository, ProjectRole } from '../repositories/projectRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { milestoneRepository } from '../repositories/milestoneRepository';
import { qaqcRepository } from '../repositories/qaqcRepository';
import { ncrRepository } from '../repositories/ncrRepository';
import { technicalReviewRepository } from '../repositories/technicalReviewRepository';
import { projectDecisionRepository } from '../repositories/projectDecisionRepository';
import { rfiRepository } from '../repositories/rfiRepository';
import { punchItemRepository } from '../repositories/punchItemRepository';
import { closeoutRepository } from '../repositories/closeoutRepository';
import { handoverRepository } from '../repositories/handoverRepository';
import { auditEventRepository } from '../repositories/auditEventRepository';
import { userRepository } from '../repositories/userRepository';
import { GovernanceError } from './governanceError';
import { AIExecutiveBriefing } from '../../src/types';

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

export class AIExecutiveBriefingService {
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

  async generateBriefing(
    projectId: string,
    userId: string,
    options?: { focusArea?: string; includeHistoricalDecisions?: boolean }
  ): Promise<AIExecutiveBriefing> {
    const role = await this.resolveUserProjectRole(projectId, userId);
    if (!role) {
      throw new GovernanceError(403, 'FORBIDDEN', 'Forbidden: Active project appointment required.');
    }

    const project = await projectRepository.getProjectById(projectId);
    if (!project) {
      throw new GovernanceError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    }

    const now = new Date().toISOString();

    // Record Request Audit
    await auditEventRepository.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      actorUserId: userId,
      projectId,
      organizationId: project.organizationId || 'org-structura-demo',
      action: 'AI_EXECUTIVE_BRIEFING_REQUESTED',
      entityType: 'AI_BRIEFING',
      entityId: `briefing-${projectId}-${Date.now()}`,
      timestamp: now,
      metadata: {
        focusArea: options?.focusArea || 'FULL_BRIEFING',
        requestedByRole: role,
      },
    });

    // Fetch canonical records
    const [
      milestones,
      technicalReviews,
      qaqcInspections,
      ncrs,
      projectDecisions,
      rfis,
      punchItems,
      closeout,
      handover,
    ] = await Promise.all([
      milestoneRepository.listMilestonesByProject(projectId),
      technicalReviewRepository.listReviewsByProject(projectId),
      qaqcRepository.listInspectionsByProject(projectId),
      ncrRepository.listNCRsByProject(projectId),
      projectDecisionRepository.listDecisionsByProject(projectId),
      rfiRepository.listRFIsByProject(projectId),
      punchItemRepository.listPunchItemsByProject(projectId),
      closeoutRepository.getCloseoutByProject(projectId),
      handoverRepository.getHandoverByProject(projectId),
    ]);

    const groundedReferences = [
      ...milestones.map(m => `Milestone: ${m.title} (${m.status}, Financial: ${m.financialStatus})`),
      ...ncrs.map(n => `NCR: ${n.number} [${n.severity}] - ${n.status}`),
      ...qaqcInspections.map(q => `QA/QC: ${q.inspectionType || q.id} - ${q.inspectionStatus}`),
      ...projectDecisions.map(d => `Decision: ${d.number} - ${d.status}`),
      ...punchItems.map(p => `Punch: ${p.number} [${p.priority}] - ${p.status}`),
      `Closeout: ${closeout?.status || 'NOT_STARTED'}`,
      `Handover: ${handover?.status || 'NOT_READY'}`,
    ];

    const sourceRecordRefs = [
      ...milestones.map(m => ({ entityType: 'MILESTONE', entityId: m.id, title: m.title })),
      ...ncrs.map(n => ({ entityType: 'NCR', entityId: n.id, title: n.number })),
      ...projectDecisions.map(d => ({ entityType: 'PROJECT_DECISION', entityId: d.id, title: d.number })),
    ];

    const ai = getAIClient();
    if (!ai) {
      // Truthful unavailable response
      const briefing: AIExecutiveBriefing = {
        id: `briefing-${projectId}-${Date.now()}`,
        projectId,
        model: 'gemini-3.7-flash',
        isAiAssisted: true,
        status: 'UNAVAILABLE',
        generatedAt: now,
        executiveBriefing: 'AI Executive Briefing is currently unavailable: GEMINI_API_KEY environment variable is not configured.',
        healthDiagnosis: 'Grounded manual evaluation required. Please inspect verified milestone, NCR, and QA/QC records.',
        progressHighlights: [
          `${milestones.filter(m => m.status === 'APPROVED').length} milestones approved under canonical governance.`,
          `${ncrs.filter(n => n.status === 'CLOSED').length} Non-Conformance Reports remediated and verified.`,
        ],
        keyRisksAndBlockers: [
          `${ncrs.filter(n => n.status !== 'CLOSED').length} open NCRs in registry.`,
          `${punchItems.filter(p => p.status !== 'CLOSED' && p.priority === 'CRITICAL').length} critical punch items pending.`,
        ],
        closeoutAndHandoverReadiness: `Closeout status is ${closeout?.status || 'NOT_STARTED'}. Handover status is ${handover?.status || 'NOT_READY'}.`,
        governanceActionsRequired: [
          'Review open NCRs and coordinate with Structural Auditor for reinspection.',
          'Resolve outstanding punch list items prior to requesting handover readiness audit.',
        ],
        referencedSourcesCount: groundedReferences.length,
        sourceRecordRefs,
        disclaimer: 'AI-GENERATED PROJECT BRIEFING. Generated from canonical project records for informational synthesis only. Does not constitute professional engineering certification, statutory approval, or financial settlement authorization.',
      };

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        organizationId: project.organizationId || 'org-structura-demo',
        action: 'AI_EXECUTIVE_BRIEFING_FAILED',
        entityType: 'AI_BRIEFING',
        entityId: briefing.id,
        timestamp: now,
        metadata: { reason: 'API_KEY_UNAVAILABLE' },
      });

      return briefing;
    }

    try {
      const prompt = `You are the executive construction intelligence synthesizer for Structura.
Generate a concise, high-level executive briefing grounded STRICTLY in the following canonical project data.

PROJECT CONTEXT:
- Project Name: ${project.name}
- Baseline Budget: $${milestones.reduce((s, m) => s + (m.costAllocationUSD || 0), 0).toLocaleString()}
- Milestones: ${JSON.stringify(milestones.map(m => ({ id: m.id, title: m.title, status: m.status, financialStatus: m.financialStatus })))}
- QA/QC Inspections: ${JSON.stringify(qaqcInspections.map(q => ({ id: q.id, inspectionStatus: q.inspectionStatus, inspectionType: q.inspectionType })))}
- Non-Conformance Reports (NCR): ${JSON.stringify(ncrs.map(n => ({ number: n.number, severity: n.severity, status: n.status, description: n.description })))}
- Project Decisions: ${JSON.stringify(projectDecisions.map(d => ({ number: d.number, title: d.title, status: d.status })))}
- Punch List Items: ${JSON.stringify(punchItems.map(p => ({ number: p.number, priority: p.priority, status: p.status, title: p.title })))}
- RFIs: ${JSON.stringify(rfis.map(r => ({ number: r.number, status: r.status, title: r.title })))}
- Closeout Status: ${closeout?.status || 'NOT_STARTED'} (Checklist: ${closeout?.checklist.filter(c => c.isCompleted).length || 0}/${closeout?.checklist.length || 0} items)
- Handover Status: ${handover?.status || 'NOT_READY'}
- Focus Area: ${options?.focusArea || 'FULL_BRIEFING'}

CRITICAL RULES:
1. Do NOT invent events, approvals, payments, or completions that are not present above.
2. Ground all statements in the actual numbers and statuses provided.
3. Financial notice: Mention that financial processing is authorized only where designated; settlement/payment is managed via external rails.
4. Return ONLY valid JSON with this exact schema:
{
  "executiveBriefing": "string (2-3 sentences high level summary)",
  "healthDiagnosis": "string (1-2 sentences)",
  "progressHighlights": ["string", "string"],
  "keyRisksAndBlockers": ["string", "string"],
  "closeoutAndHandoverReadiness": "string",
  "governanceActionsRequired": ["string", "string"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.warn('Failed to parse Gemini response JSON:', responseText);
      }

      const briefing: AIExecutiveBriefing = {
        id: `briefing-${projectId}-${Date.now()}`,
        projectId,
        model: 'gemini-3.7-flash',
        isAiAssisted: true,
        status: 'COMPLETED',
        generatedAt: now,
        executiveBriefing: parsed.executiveBriefing || `Project ${project.name} is progressing under governed milestone execution. ${milestones.filter(m => m.status === 'APPROVED').length} milestones approved to date.`,
        healthDiagnosis: parsed.healthDiagnosis || 'Grounded in active milestone, NCR, and punch item records.',
        progressHighlights: parsed.progressHighlights || [
          `${milestones.filter(m => m.status === 'APPROVED').length} milestones approved and verified.`,
          `${projectDecisions.filter(d => d.status === 'DECIDED').length} governance decisions formalized.`,
        ],
        keyRisksAndBlockers: parsed.keyRisksAndBlockers || [
          `${ncrs.filter(n => n.status !== 'CLOSED').length} open NCR(s) require reinspection.`,
          `${punchItems.filter(p => p.status !== 'CLOSED' && p.priority === 'CRITICAL').length} critical punch item(s) pending.`,
        ],
        closeoutAndHandoverReadiness: parsed.closeoutAndHandoverReadiness || `Closeout is currently ${closeout?.status || 'NOT_STARTED'} with handover package ${handover?.status || 'NOT_READY'}.`,
        governanceActionsRequired: parsed.governanceActionsRequired || [
          'Address open NCRs to remove closeout blockers.',
          'Verify pending contractor punch list submissions.',
        ],
        referencedSourcesCount: groundedReferences.length,
        sourceRecordRefs,
        disclaimer: 'AI-GENERATED PROJECT BRIEFING. Generated by gemini-3.7-flash grounded in canonical project records. Does not constitute professional engineering certification, statutory sign-off, or financial payment execution.',
      };

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        organizationId: project.organizationId || 'org-structura-demo',
        action: 'AI_EXECUTIVE_BRIEFING_COMPLETED',
        entityType: 'AI_BRIEFING',
        entityId: briefing.id,
        timestamp: now,
        metadata: {
          modelName: 'gemini-3.7-flash',
          focusArea: options?.focusArea || 'FULL_BRIEFING',
        },
      });

      return briefing;
    } catch (err: any) {
      console.error('Gemini AI briefing error:', err);

      await auditEventRepository.record({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        actorUserId: userId,
        projectId,
        organizationId: project.organizationId || 'org-structura-demo',
        action: 'AI_EXECUTIVE_BRIEFING_FAILED',
        entityType: 'AI_BRIEFING',
        entityId: `briefing-${projectId}-${Date.now()}`,
        timestamp: now,
        metadata: { error: err?.message || 'Inference error' },
      });

      return {
        id: `briefing-${projectId}-${Date.now()}`,
        projectId,
        model: 'gemini-3.7-flash',
        isAiAssisted: true,
        status: 'HUMAN_REVIEW_REQUIRED',
        generatedAt: now,
        executiveBriefing: 'AI Executive Briefing could not be completed due to an analysis service error. Please refer to the canonical Executive Project Report for verified project status.',
        healthDiagnosis: 'Human review required.',
        progressHighlights: [],
        keyRisksAndBlockers: ['AI generation interrupted; manual record verification required.'],
        closeoutAndHandoverReadiness: 'Human review required.',
        governanceActionsRequired: ['Inspect verified milestone and NCR registers directly.'],
        referencedSourcesCount: groundedReferences.length,
        sourceRecordRefs,
        disclaimer: 'AI-GENERATED PROJECT BRIEFING. Analysis failed. Human review required.',
        errorMessage: err?.message,
      };
    }
  }
}

export const aiExecutiveBriefingService = new AIExecutiveBriefingService();
