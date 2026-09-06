import { projectRepository } from './server/repositories/projectRepository';
import { executiveReportingService } from './server/services/executiveReportingService';
import { closeoutService } from './server/services/closeoutService';
import { punchItemService } from './server/services/punchItemService';
import { handoverService } from './server/services/handoverService';
import { aiExecutiveBriefingService } from './server/services/aiExecutiveBriefingService';
import { auditEventRepository } from './server/repositories/auditEventRepository';
import { GovernanceError } from './server/services/governanceError';

async function runSprint05AAcceptanceTests() {
  console.log('====================================================');
  console.log('STRUCTURA SPRINT 05A ACCEPTANCE TEST SUITE');
  console.log('Executive Reporting, Project Health, Closeout, Punch List, Handover');
  console.log('====================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   Details: ${details}`);
      failedTests++;
    }
  }

  // Setup Test Project & Users
  const projectId = 'proj-sp05a-test-' + Date.now();
  const ownerId = 'user-owner-05a';
  const directorId = 'user-director-05a';
  const contractorId = 'user-contractor-05a';
  const auditorId = 'user-auditor-05a';
  const unauthorizedUserId = 'user-unauthorized-05a';

  console.log('--- 1. Setting up Test Governance Project ---');
  await projectRepository.createProject({
    id: projectId,
    organizationId: 'org-test-05a',
    name: 'Metropolis Tower Closeout & Handover Phase',
    description: 'Sprint 05A Governance Acceptance Test Project',
    location: 'Austin, TX',
    ownerUserId: ownerId,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Add appointments
  await projectRepository.createAppointment({
    id: 'appt-director-05a',
    projectId,
    userId: directorId,
    role: 'SENIOR_PROJECT_DIRECTOR',
    appointedByUserId: ownerId,
    appointmentStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  await projectRepository.createAppointment({
    id: 'appt-contractor-05a',
    projectId,
    userId: contractorId,
    role: 'GENERAL_CONTRACTOR',
    appointedByUserId: ownerId,
    appointmentStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  await projectRepository.createAppointment({
    id: 'appt-auditor-05a',
    projectId,
    userId: auditorId,
    role: 'STRUCTURAL_QA_QC_AUDITOR',
    appointedByUserId: ownerId,
    appointmentStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  console.log('--- 2. Executive Reporting & Project Health ---');
  try {
    const report = await executiveReportingService.generateExecutiveReport(projectId, ownerId);
    assert(report.projectId === projectId, 'Executive Report contains correct project ID');
    assert(report.health.overallScore >= 0 && report.health.overallScore <= 100, 'Health score is calculated within 0-100 range');
    assert(report.health.factors.length >= 5, 'Health includes multi-factor explainable breakdown');
    assert(report.financialGovernance.note.includes('No BMONI') || report.financialGovernance.note.includes('BMONI is NOT integrated'), 'Financial boundary truthfully notes no BMONI integration');

    // Test unauthorized user access to executive report
    let unauthorizedCaught = false;
    try {
      await executiveReportingService.generateExecutiveReport(projectId, unauthorizedUserId);
    } catch (err: any) {
      unauthorizedCaught = err instanceof GovernanceError && err.statusCode === 403;
    }
    assert(unauthorizedCaught, 'Executive Report rejects unauthorized user with HTTP 403');
  } catch (err: any) {
    assert(false, 'Executive Reporting Suite execution', err.message);
  }

  console.log('\n--- 3. Outstanding Items / Punch List Domain ---');
  let createdPunchId = '';
  try {
    // 3a. Create Punch Item
    const punchItem = await punchItemService.createPunchItem(projectId, directorId, {
      title: 'Curtain Wall Sealant Defect on Level 12',
      description: 'Minor silicone bead imperfection along mullion junction.',
      category: 'FINISH',
      priority: 'HIGH',
      location: 'Level 12 South Facade',
      trade: 'Glazing Subcontractor',
    });
    createdPunchId = punchItem.id;
    assert(punchItem.status === 'OPEN', 'Punch Item created with OPEN status');
    assert(punchItem.number.startsWith('PUNCH-'), 'Punch Item assigned sequential numbering');

    // 3b. Contractor submits resolution
    const resolvedItem = await punchItemService.submitResolution(projectId, createdPunchId, contractorId, {
      resolutionDescription: 'Re-tooled silicone bead and re-inspected adhesion.',
    });
    assert(resolvedItem.status === 'READY_FOR_VERIFICATION', 'Punch Item status transitioned to READY_FOR_VERIFICATION');

    // 3c. Contractor cannot self-verify (Authority Boundary)
    let contractorSelfVerifyBlocked = false;
    try {
      await punchItemService.verifyPunchItem(projectId, createdPunchId, contractorId, {
        decision: 'VERIFIED',
        verificationNotes: 'Contractor self-verification attempt',
      });
    } catch (err: any) {
      contractorSelfVerifyBlocked = err instanceof GovernanceError && err.statusCode === 403;
    }
    assert(contractorSelfVerifyBlocked, 'General Contractor is forbidden from self-verifying punch items');

    // 3d. QA/QC Auditor or Senior Project Director verifies item
    const verifiedItem = await punchItemService.verifyPunchItem(projectId, createdPunchId, auditorId, {
      decision: 'VERIFIED',
      verificationNotes: 'Silicone seal inspected and verified compliant with ASTM C920 standard.',
    });
    assert(verifiedItem.status === 'VERIFIED', 'Auditor successfully verified punch item');

    // 3e. Formal closure by Director
    const closedItem = await punchItemService.closePunchItem(
      projectId,
      createdPunchId,
      directorId,
      'Formally closed in punch list register.'
    );
    assert(closedItem.status === 'CLOSED', 'Punch Item formally closed');
  } catch (err: any) {
    assert(false, 'Punch List Suite execution', err.message);
  }

  console.log('\n--- 4. Project Closeout Governance ---');
  try {
    // 4a. Start Closeout
    const closeout = await closeoutService.startCloseout(projectId, directorId);
    assert(closeout.status === 'IN_PROGRESS', 'Closeout initiated in IN_PROGRESS state');
    assert(closeout.checklist.length >= 8, 'Default Closeout Checklist populated with governed categories');

    // 4b. Contractor forbidden from signing off closeout governance checklist
    const firstChecklistId = closeout.checklist[0].id;
    let contractorCloseoutBlocked = false;
    try {
      await closeoutService.updateChecklistItem(projectId, firstChecklistId, contractorId, {
        isCompleted: true,
        notes: 'Contractor sign-off attempt',
      });
    } catch (err: any) {
      contractorCloseoutBlocked = err instanceof GovernanceError && err.statusCode === 403;
    }
    assert(contractorCloseoutBlocked, 'General Contractor cannot sign off on closeout governance items');

    // 4c. Director marks checklist items complete
    for (const item of closeout.checklist) {
      await closeoutService.updateChecklistItem(projectId, item.id, directorId, {
        isCompleted: true,
        notes: 'Verified complete against technical specs.',
      });
    }

    // 4d. Submit Closeout for Review
    const submittedCloseout = await closeoutService.submitCloseoutForReview(projectId, directorId);
    assert(submittedCloseout.status === 'READY_FOR_REVIEW', 'Closeout transitioned to READY_FOR_REVIEW');

    // 4e. Complete Closeout
    const completedCloseout = await closeoutService.completeCloseout(projectId, directorId, {
      closeoutNotes: 'All closeout requirements and warranties verified.',
    });
    assert(completedCloseout.status === 'COMPLETED', 'Closeout marked COMPLETED');
  } catch (err: any) {
    assert(false, 'Closeout Governance Suite execution', err.message);
  }

  console.log('\n--- 5. Project Handover & Acceptance Gates ---');
  try {
    // 5a. Prepare Handover Dossier
    const handover = await handoverService.prepareHandover(projectId, directorId, {});
    assert(handover.status === 'IN_PREPARATION', 'Handover dossier initialized in IN_PREPARATION status');

    // 5b. Complete handover checklist deliverables
    for (const item of handover.checklist) {
      await handoverService.updateChecklistItem(projectId, item.id, directorId, {
        isCompleted: true,
        notes: 'Handover deliverable compiled and verified.',
      });
    }

    // 5c. Submit Handover for Owner Review
    const submittedHandover = await handoverService.submitHandoverForReview(projectId, directorId);
    assert(submittedHandover.status === 'READY_FOR_REVIEW', 'Handover submitted for Owner Review');

    // 5d. Non-Owner cannot accept handover (Authority Boundary)
    let nonOwnerAcceptanceBlocked = false;
    try {
      await handoverService.acceptHandover(projectId, directorId, {
        acceptanceNotes: 'Director acceptance attempt',
      });
    } catch (err: any) {
      nonOwnerAcceptanceBlocked = err instanceof GovernanceError && err.statusCode === 403;
    }
    assert(nonOwnerAcceptanceBlocked, 'Non-Owner is strictly blocked from formal handover acceptance');

    // 5e. Formal Owner Acceptance
    const acceptedHandover = await handoverService.acceptHandover(projectId, ownerId, {
      acceptanceNotes: 'Owner formal acceptance of facility custody and completion dossier.',
    });
    assert(acceptedHandover.status === 'HANDOVER_COMPLETE', 'Owner successfully accepted formal handover');
  } catch (err: any) {
    assert(false, 'Handover Suite execution', err.message);
  }

  console.log('\n--- 6. Final Project Record Package & Archival ---');
  try {
    const finalRecord = await executiveReportingService.getFinalProjectRecordPackage(projectId, ownerId);
    assert(finalRecord.project.id === projectId, 'Final Record Package compiled for target project');
    assert(finalRecord.records.punchItems.length > 0, 'Final Record Package includes punch item records');
    assert(finalRecord.records.closeout !== null, 'Final Record Package includes closeout record');
    assert(finalRecord.records.handover !== null, 'Final Record Package includes handover record');
    assert(finalRecord.archivalStatus === 'ARCHIVED', 'Archival status reflects completed handover');
  } catch (err: any) {
    assert(false, 'Final Project Record Suite execution', err.message);
  }

  console.log('\n--- 7. AI Executive Project Briefing Synthesis ---');
  try {
    const briefing = await aiExecutiveBriefingService.generateBriefing(projectId, ownerId);
    assert(briefing.projectId === projectId, 'AI Briefing generated for project');
    assert(briefing.model === 'gemini-3.7-flash', 'AI Briefing specifies runtime model gemini-3.7-flash');
    assert(briefing.isAiAssisted === true, 'AI Briefing truthfully tagged as isAiAssisted');
    assert(briefing.disclaimer.length > 0, 'AI Briefing includes truthful disclaimer banner');
    assert(
      ['COMPLETED', 'HUMAN_REVIEW_REQUIRED', 'UNAVAILABLE', 'FAILED'].includes(briefing.status),
      'AI Briefing returned valid truthful status'
    );
    assert(
      briefing.status !== 'UNAVAILABLE' || briefing.executiveBriefing.toLowerCase().includes('unavailable'),
      'AI unavailability is reported truthfully without fabricated completion'
    );
  } catch (err: any) {
    assert(false, 'AI Executive Briefing Suite execution', err.message);
  }

  console.log('\n--- 8. Audit Event Trail Verification ---');
  const auditEvents = await auditEventRepository.listByProject(projectId);
  const actions = auditEvents.map(a => a.action);
  assert(actions.includes('EXECUTIVE_REPORT_GENERATED'), 'Audit trail logged EXECUTIVE_REPORT_GENERATED');
  assert(actions.includes('PUNCH_ITEM_CREATED'), 'Audit trail logged PUNCH_ITEM_CREATED');
  assert(actions.includes('PUNCH_ITEM_VERIFIED'), 'Audit trail logged PUNCH_ITEM_VERIFIED');
  assert(actions.includes('CLOSEOUT_STARTED'), 'Audit trail logged CLOSEOUT_STARTED');
  assert(actions.includes('HANDOVER_ACCEPTED'), 'Audit trail logged HANDOVER_ACCEPTED');

  console.log('\n====================================================');
  console.log(`ACCEPTANCE RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSprint05AAcceptanceTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
