import React, { useState, useEffect } from 'react';
import { FinalProjectRecordPackage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Archive,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Camera,
  Award,
  AlertTriangle,
  Printer,
  Download,
  Building,
  KeyRound,
  FileCheck2,
  FolderArchive,
  History,
} from 'lucide-react';

interface FinalProjectRecordPanelProps {
  projectId: string;
  userRole?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const FinalProjectRecordPanel: React.FC<FinalProjectRecordPanelProps> = ({
  projectId,
  userRole,
  onNavigateToTab,
}) => {
  const { user, idToken } = useAuth();
  const [recordPackage, setRecordPackage] = useState<FinalProjectRecordPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'SUMMARY' | 'MILESTONES' | 'QA_QC' | 'CLOSEOUT' | 'AUDIT'>('SUMMARY');

  const fetchRecordPackage = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/final-record-package`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch final project record package');
      }
      setRecordPackage(data.package);
    } catch (err: any) {
      setError(err.message || 'Failed to load project record package');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordPackage();
  }, [projectId, idToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600 text-sm">Compiling Canonical Final Project Record Dossier...</span>
      </div>
    );
  }

  if (error || !recordPackage) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
        <div>
          <h4 className="font-bold">Error loading Final Project Record</h4>
          <p className="text-xs text-rose-700 mt-1">{error || 'Unknown error.'}</p>
        </div>
      </div>
    );
  }

  const { project, report, records, auditTrail, archivalStatus } = recordPackage;

  return (
    <div className="space-y-6">
      {/* Dossier Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-slate-100 rounded-lg text-slate-800 border border-slate-200">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{project.name} — Final Project Record</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      archivalStatus === 'ARCHIVED'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {archivalStatus === 'ARCHIVED' ? 'ARCHIVED RECORD' : 'ACTIVE GOVERNANCE DOSSIER'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent immutable compilation of all governed project decisions, technical reviews, QA/QC audits, NCR clearances, and handover records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print / Export Complete Dossier
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
          {[
            { id: 'SUMMARY', label: 'Executive Overview', icon: FileText },
            { id: 'MILESTONES', label: `Milestones & Evidence (${records.milestones.length})`, icon: Layers },
            { id: 'QA_QC', label: `QA/QC & NCRs (${records.qaqcInspections.length + records.ncrs.length})`, icon: ShieldCheck },
            { id: 'CLOSEOUT', label: `Closeout & Handover`, icon: KeyRound },
            { id: 'AUDIT', label: `Governance Audit Trail (${auditTrail.length})`, icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  activeSection === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: SUMMARY */}
      {activeSection === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <span className="text-xs font-medium text-slate-500">Project Baseline Budget</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                ${report.financialGovernance.costAllocationTotalUSD.toLocaleString()}
              </div>
              <div className="text-xs text-emerald-700 mt-2 font-medium">
                ${report.financialGovernance.authorizedForFinancialProcessingUSD.toLocaleString()} Authorized for Processing
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <span className="text-xs font-medium text-slate-500">Milestone Governance</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {report.progress.completedCount} / {report.progress.totalMilestones}
              </div>
              <div className="text-xs text-indigo-700 mt-2 font-medium">
                {report.progress.percentMilestonesApproved}% Milestones Formally Approved
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
              <span className="text-xs font-medium text-slate-500">Handover Status</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {records.handover?.status || 'NOT_READY'}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Closeout state: {records.closeout?.status || 'NOT_STARTED'}
              </div>
            </div>
          </div>

          {/* Record Counts Summary */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Consolidated Record Package Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Milestones</span>
                <strong className="text-base text-slate-900">{records.milestones.length}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Evidence Uploads</span>
                <strong className="text-base text-slate-900">{records.evidence.length}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Technical Reviews</span>
                <strong className="text-base text-slate-900">{records.technicalReviews.length}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">QA/QC Inspections</span>
                <strong className="text-base text-slate-900">{records.qaqcInspections.length}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Non-Conformance Reports</span>
                <strong className="text-base text-slate-900">{records.ncrs.length}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Owner Decisions</span>
                <strong className="text-base text-slate-900">{records.ownerDecisions.length}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Project Decisions</span>
                <strong className="text-base text-slate-900">{records.projectDecisions.length}</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Punch List Items</span>
                <strong className="text-base text-slate-900">{records.punchItems.length}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: MILESTONES */}
      {activeSection === 'MILESTONES' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Governed Project Milestones & Verification History
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {records.milestones.map((m, idx) => (
              <div key={m.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      M{idx + 1}: {m.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        m.status === 'APPROVED' || m.status === 'COMPLETE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">${(m.costAllocationUSD || 0).toLocaleString()}</div>
                  <span className="text-[10px] text-slate-400 block">{m.financialStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: QA/QC & NCRs */}
      {activeSection === 'QA_QC' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              QA/QC Inspection Audits
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {records.qaqcInspections.map(i => (
                <div key={i.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">{i.inspectionType}</span>
                    <p className="text-xs text-slate-500 mt-1">{i.inspectionNotes}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      i.inspectionStatus === 'PASSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {i.inspectionStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Non-Conformance Report (NCR) Registry
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {records.ncrs.map(n => (
                <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      {n.number}: {n.title}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{n.description}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      n.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {n.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: CLOSEOUT & HANDOVER */}
      {activeSection === 'CLOSEOUT' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Closeout Checklist Execution Record
            </h3>
            {records.closeout ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {records.closeout.checklist.map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                      {item.notes && <p className="text-[11px] text-indigo-700 mt-1">Note: {item.notes}</p>}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        item.isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.isCompleted ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No closeout record initiated.</p>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: AUDIT TRAIL */}
      {activeSection === 'AUDIT' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Immutable Governance Audit Events
          </h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {auditTrail.map(event => (
              <div key={event.id} className="p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{event.action}</span>
                  <span className="text-slate-500 ml-2">({event.entityType})</span>
                  <div className="text-[11px] text-slate-400 mt-0.5">Actor: {event.actorUserId}</div>
                </div>
                <div className="text-slate-400 text-[11px]">{new Date(event.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
