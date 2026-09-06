import React, { useState, useEffect } from 'react';
import {
  ProjectHandover,
  HandoverChecklistItem,
  HandoverReadinessEvaluation,
  HandoverStatus,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  RotateCcw,
  Send,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  FileText,
  AlertCircle,
  HelpCircle,
  Award,
} from 'lucide-react';

interface ProjectHandoverPanelProps {
  projectId: string;
  userRole?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const ProjectHandoverPanel: React.FC<ProjectHandoverPanelProps> = ({
  projectId,
  userRole,
  onNavigateToTab,
}) => {
  const { user, idToken } = useAuth();
  const [handover, setHandover] = useState<ProjectHandover | null>(null);
  const [evaluation, setEvaluation] = useState<HandoverReadinessEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions / Modals
  const [actionLoading, setActionLoading] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  // Checklist Item Detail Modal
  const [selectedItem, setSelectedItem] = useState<HandoverChecklistItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemRefId, setItemRefId] = useState('');

  const fetchHandover = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/handover`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch handover package');
      }
      setHandover(data.handover);
      setEvaluation(data.evaluation);
    } catch (err: any) {
      setError(err.message || 'Failed to load handover details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandover();
  }, [projectId, idToken]);

  const handlePrepareHandover = async () => {
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/handover/prepare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to prepare handover dossier');
      }
      fetchHandover();
    } catch (err: any) {
      alert(err.message || 'Error preparing handover package');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleChecklistItem = async (item: HandoverChecklistItem) => {
    if (userRole === 'GENERAL_CONTRACTOR') {
      alert('General Contractor cannot sign off on final handover deliverables. Sign-off requires Senior Project Director or Owner.');
      return;
    }

    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/handover/checklist/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isCompleted: !item.isCompleted,
          notes: item.notes,
          verifiedReferenceId: item.verifiedReferenceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update handover checklist item');
      }
      fetchHandover();
    } catch (err: any) {
      alert(err.message || 'Error updating item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveItemDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/handover/checklist/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isCompleted: selectedItem.isCompleted,
          notes: itemNotes,
          verifiedReferenceId: itemRefId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update handover item details');
      }
      setSelectedItem(null);
      fetchHandover();
    } catch (err: any) {
      alert(err.message || 'Error saving details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForOwnerReview = async () => {
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/handover/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit handover for Owner review');
      }
      fetchHandover();
    } catch (err: any) {
      alert(err.message || 'Error submitting for review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/handover/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          acceptanceNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to formally accept handover');
      }
      setShowAcceptModal(false);
      fetchHandover();
    } catch (err: any) {
      alert(err.message || 'Error accepting handover');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason) return;
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/handover/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          returnReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to return handover');
      }
      setShowReturnModal(false);
      fetchHandover();
    } catch (err: any) {
      alert(err.message || 'Error returning handover');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-slate-600 text-sm">Evaluating Handover Readiness & Governance Records...</span>
      </div>
    );
  }

  const getStatusBadge = (status: HandoverStatus) => {
    switch (status) {
      case 'HANDOVER_COMPLETE':
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Award className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            HANDOVER COMPLETED & ACCEPTED
          </span>
        );
      case 'READY_FOR_REVIEW':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            AWAITING OWNER ACCEPTANCE
          </span>
        );
      case 'IN_PREPARATION':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            DOSSIER IN PREPARATION
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
            RETURNED FOR REVISION
          </span>
        );
      case 'NOT_READY':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />
            READINESS GATES PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 rounded-lg text-amber-700 border border-amber-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Project Handover & Acceptance</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Governed asset transition from Senior Project Director & Contractor to formal Owner/Client Custody.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {handover && getStatusBadge(handover.status)}
            {!handover && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                HANDOVER DOSSIER UNINITIATED
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Server-enforced governance gates ensure all prerequisites are verified prior to formal handover transfer.
          </div>

          <div className="flex items-center gap-2">
            {!handover && (
              <button
                type="button"
                onClick={handlePrepareHandover}
                disabled={actionLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <FileCheck2 className="w-4 h-4" />
                Initialize Handover Dossier
              </button>
            )}

            {handover && (handover.status === 'IN_PREPARATION' || handover.status === 'RETURNED') && (
              <button
                type="button"
                onClick={handleSubmitForOwnerReview}
                disabled={actionLoading || !evaluation?.isReadyForReview}
                title={!evaluation?.isReadyForReview ? 'All readiness gates and checklist items must be satisfied.' : ''}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Submit Dossier for Owner Acceptance
              </button>
            )}

            {handover && handover.status === 'READY_FOR_REVIEW' && userRole === 'OWNER_CLIENT' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowReturnModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Return with Remarks
                </button>
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Award className="w-4 h-4" />
                  Formally Accept Project Handover
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Readiness Gates Evaluation Grid */}
      {evaluation && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Handover Readiness Gate Criteria
            </h3>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                evaluation.isReadyForReview
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {evaluation.isReadyForReview ? 'ALL GATES CLEARED' : `${evaluation.blockingGatesCount} GATE(S) PENDING`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {evaluation.gates.map(gate => (
              <div
                key={gate.id}
                className={`p-3.5 rounded-lg border text-xs flex flex-col justify-between ${
                  gate.status === 'PASSED'
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                    : gate.status === 'BLOCKED'
                    ? 'bg-rose-50/50 border-rose-200 text-slate-800'
                    : 'bg-amber-50/50 border-amber-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-slate-900">{gate.name}</span>
                    {gate.status === 'PASSED' ? (
                      <span className="flex items-center text-emerald-700 font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" /> PASSED
                      </span>
                    ) : gate.status === 'BLOCKED' ? (
                      <span className="flex items-center text-rose-700 font-bold text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5 mr-0.5" /> BLOCKED
                      </span>
                    ) : (
                      <span className="flex items-center text-amber-700 font-bold text-[10px]">
                        <Clock className="w-3.5 h-3.5 mr-0.5" /> ATTENTION
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">{gate.description}</p>
                </div>
                {gate.details && gate.details.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500">
                    {gate.details.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handover Deliverables Checklist */}
      {handover && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Handover Deliverables & Custody Transfer Checklist
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and formally verify all essential building manuals, statutory clearances, warranties, and physical keys.
              </p>
            </div>
            <div className="text-xs text-slate-600">
              Completed:{' '}
              <span className="font-bold text-slate-900">
                {handover.checklist.filter(i => i.isCompleted).length} / {handover.checklist.length}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {handover.checklist.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 transition-colors flex items-start justify-between gap-4 ${
                  item.isCompleted ? 'bg-slate-50/50' : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklistItem(item)}
                    disabled={actionLoading || handover.status === 'HANDOVER_COMPLETE'}
                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      item.isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  >
                    {item.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{item.title}</span>
                      {item.isRequired && (
                        <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                    {item.notes && (
                      <p className="text-xs text-indigo-700 bg-indigo-50/70 px-2 py-1 rounded mt-2 border border-indigo-100 inline-block">
                        <strong>Sign-off Note:</strong> {item.notes}
                      </p>
                    )}
                    {item.completedByName && (
                      <div className="text-[11px] text-slate-400 mt-1">
                        Verified by {item.completedByName} on {new Date(item.completedAt!).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(item);
                      setItemNotes(item.notes || '');
                      setItemRefId(item.verifiedReferenceId || '');
                    }}
                    disabled={handover.status === 'HANDOVER_COMPLETE'}
                    className="text-xs text-slate-500 hover:text-slate-800 p-1.5 hover:bg-slate-100 rounded transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Handover Completed Certificate Banner */}
      {handover && handover.status === 'HANDOVER_COMPLETE' && (
        <div className="bg-linear-to-r from-emerald-800 to-teal-900 text-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
                <Award className="w-4 h-4 text-emerald-300" />
                Formal Certificate of Handover
              </div>
              <h3 className="text-xl font-bold">Project Formally Accepted & Transferred</h3>
              <p className="text-emerald-100 text-xs mt-1 max-w-2xl">
                The Owner/Client has formally accepted custody of the completed asset. All milestone warranties, technical review files, QA/QC audits, NCR closures, and closeout items have been permanently archived into the final project record.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-emerald-200">
                <div>Accepted By: <strong className="text-white">{handover.acceptedByName || 'Owner/Client'}</strong></div>
                <div>Date: <strong className="text-white">{handover.acceptedAt ? new Date(handover.acceptedAt).toLocaleDateString() : 'N/A'}</strong></div>
                {handover.acceptanceNotes && (
                  <div>Remarks: <em className="text-emerald-100">"{handover.acceptanceNotes}"</em></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Return Handover Package</h3>
            <p className="text-xs text-slate-500 mb-4">
              Specify what deficiencies or incomplete items prevent formal handover acceptance.
            </p>
            <form onSubmit={handleReturnHandover} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Return Reason / Required Revisions</label>
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  required
                  rows={4}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  placeholder="State specific items (e.g. missing warranty certificate for HVAC chiller, incomplete testing logs)..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Return Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">Formally Accept Project Handover</h3>
            <p className="text-xs text-slate-500 mb-4">
              As the Owner/Client, you are formally accepting custody of the constructed facility. This permanently marks the handover as complete under project governance.
            </p>
            <form onSubmit={handleAcceptHandover} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Acceptance Notes & Custody Remarks</label>
                <textarea
                  value={acceptanceNotes}
                  onChange={e => setAcceptanceNotes(e.target.value)}
                  rows={4}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="Facility accepted in full compliance with contract drawings and QA/QC specifications..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Confirm Formal Acceptance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">{selectedItem.title}</h3>
            <p className="text-xs text-slate-500 mb-4">{selectedItem.description}</p>
            <form onSubmit={handleSaveItemDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Verification Reference / Evidence ID</label>
                <input
                  type="text"
                  value={itemRefId}
                  onChange={e => setItemRefId(e.target.value)}
                  placeholder="e.g. DOC-ASBUILT-01, EVD-WARRANTY-101"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Verification Notes</label>
                <textarea
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  rows={3}
                  placeholder="Remarks on deliverable completeness..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Save Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
