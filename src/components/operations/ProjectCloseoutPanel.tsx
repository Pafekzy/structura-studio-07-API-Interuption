import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  RotateCcw,
  Send,
  Lock,
  Unlock,
  CheckSquare,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { ProjectCloseout, CloseoutChecklistItem, CloseoutGateEvaluation, CloseoutCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProjectCloseoutPanelProps {
  projectId: string;
  userRole?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const ProjectCloseoutPanel: React.FC<ProjectCloseoutPanelProps> = ({
  projectId,
  userRole,
  onNavigateToTab,
}) => {
  const { user, idToken } = useAuth();
  const [closeout, setCloseout] = useState<ProjectCloseout | null>(null);
  const [evaluation, setEvaluation] = useState<CloseoutGateEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Modals & Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');

  // Checklist Item Editing
  const [selectedItemForNotes, setSelectedItemForNotes] = useState<CloseoutChecklistItem | null>(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemRefId, setItemRefId] = useState('');

  const fetchCloseout = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/closeout`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch closeout state');
      }
      setCloseout(data.closeout);
      setEvaluation(data.evaluation);
    } catch (err: any) {
      setError(err.message || 'Failed to load closeout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloseout();
  }, [projectId, idToken]);

  const handleStartCloseout = async () => {
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/closeout/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate closeout');
      }
      fetchCloseout();
    } catch (err: any) {
      alert(err.message || 'Error starting closeout');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleChecklistItem = async (item: CloseoutChecklistItem) => {
    if (userRole === 'GENERAL_CONTRACTOR') {
      alert('General Contractor cannot sign off on closeout governance items. Sign-off requires Senior Project Director, QA/QC Auditor, or Owner.');
      return;
    }

    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/closeout/checklist/${item.id}`, {
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
        throw new Error(data.error || 'Failed to update checklist item');
      }
      fetchCloseout();
    } catch (err: any) {
      alert(err.message || 'Error updating checklist item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveItemDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForNotes) return;

    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/closeout/checklist/${selectedItemForNotes.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isCompleted: selectedItemForNotes.isCompleted,
          notes: itemNotes,
          verifiedReferenceId: itemRefId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update item details');
      }
      setSelectedItemForNotes(null);
      fetchCloseout();
    } catch (err: any) {
      alert(err.message || 'Error saving checklist item details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/closeout/submit-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit closeout for review');
      }
      fetchCloseout();
    } catch (err: any) {
      alert(err.message || 'Error submitting closeout for review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteCloseout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/closeout/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          closeoutNotes: completeNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete closeout');
      }
      setShowCompleteModal(false);
      fetchCloseout();
    } catch (err: any) {
      alert(err.message || 'Error completing closeout');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnCloseout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReason) return;
    try {
      setActionLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/closeout/return`, {
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
        throw new Error(data.error || 'Failed to return closeout');
      }
      setShowReturnModal(false);
      fetchCloseout();
    } catch (err: any) {
      alert(err.message || 'Error returning closeout');
    } finally {
      setActionLoading(false);
    }
  };

  const isDirector = userRole === 'SENIOR_PROJECT_DIRECTOR';
  const isOwner = userRole === 'OWNER_CLIENT';
  const isContractor = userRole === 'GENERAL_CONTRACTOR';

  const checklistItems = closeout?.checklist || [];
  const filteredChecklist = checklistItems.filter(item => {
    if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
    return true;
  });

  const completedCount = checklistItems.filter(i => i.isCompleted).length;
  const totalCount = checklistItems.length;
  const checklistPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Project Lifecycle
            </span>
            <span className="text-xs text-slate-400">Sprint 05A Closeout Domain</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <span>Governed Project Closeout Governance</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Formal engineering closeout verification across milestone approvals, independent QA/QC clearance, NCR remediation, and Punch List closure.
          </p>
        </div>

        {/* Status Badge & Primary Action */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Closeout Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block mt-0.5 ${
                closeout?.status === 'COMPLETED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : closeout?.status === 'READY_FOR_REVIEW'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 animate-pulse'
                  : closeout?.status === 'IN_PROGRESS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : closeout?.status === 'RETURNED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {(closeout?.status || 'NOT_STARTED').replace(/_/g, ' ')}
            </span>
          </div>

          {(!closeout || closeout.status === 'NOT_STARTED') && (isDirector || isOwner) && (
            <button
              onClick={handleStartCloseout}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10"
            >
              <Unlock className="w-4 h-4" />
              <span>Initiate Closeout</span>
            </button>
          )}

          {closeout?.status === 'IN_PROGRESS' && isDirector && (
            <button
              onClick={handleSubmitForReview}
              disabled={actionLoading || !evaluation?.canComplete}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                evaluation?.canComplete
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/10'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
              title={evaluation?.canComplete ? 'Submit for Owner review' : 'Cannot submit: active closeout blockers exist'}
            >
              <Send className="w-4 h-4" />
              <span>Submit for Review</span>
            </button>
          )}

          {closeout?.status === 'READY_FOR_REVIEW' && (isOwner || isDirector) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={actionLoading || !evaluation?.canComplete}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Formally Complete Closeout</span>
              </button>
              <button
                onClick={() => setShowReturnModal(true)}
                disabled={actionLoading}
                className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Return</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Closeout Gate Evaluation Banner */}
      {evaluation && (
        <div
          className={`p-5 rounded-2xl border ${
            evaluation.canComplete
              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
              : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {evaluation.canComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold text-white">
                  {evaluation.canComplete
                    ? 'All Closeout Quality & Governance Gates Satisfied'
                    : `Closeout Gates Incomplete (${evaluation.blockers.length} Active Blocker${evaluation.blockers.length > 1 ? 's' : ''})`}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  {evaluation.canComplete
                    ? 'All required milestones are approved, QA/QC inspections passed, NCRs resolved, and checklist items completed. Ready for formal closeout sign-off.'
                    : 'The project cannot be formally closed out until all blocking conditions are remediated under governed workflows.'}
                </p>

                {evaluation.blockers.length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-xs text-amber-300/90 list-disc list-inside">
                    {evaluation.blockers.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Checklist Progress</span>
              <span className="text-2xl font-black text-white">{checklistPercentage}%</span>
              <span className="text-[10px] text-slate-400 block">
                {completedCount} / {totalCount} items
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {['ALL', 'MILESTONES', 'QA_QC', 'NCRS', 'EVIDENCE', 'DECISIONS', 'PUNCH_ITEMS', 'GOVERNANCE', 'DOCUMENTATION'].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/20 rounded-2xl border border-slate-800 animate-pulse">
          Loading project closeout checklist...
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredChecklist.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/20 rounded-2xl border border-slate-800">
          <FileCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-bold text-sm text-slate-300">No closeout items in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChecklist.map(item => {
            const isCompleted = item.isCompleted;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/10 border-emerald-900/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => handleToggleChecklistItem(item)}
                      disabled={isContractor || actionLoading || closeout?.status === 'COMPLETED'}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-700 hover:border-amber-500 bg-slate-800'
                      } ${isContractor ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category.replace(/_/g, ' ')}
                        </span>
                        {item.isRequired && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            Required
                          </span>
                        )}
                        {item.verifiedReferenceId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-400 border border-slate-700">
                            Ref: {item.verifiedReferenceId}
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{item.description}</p>

                      {item.notes && (
                        <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 mt-2">
                          <strong>Verification Notes:</strong> {item.notes}
                        </p>
                      )}

                      {isCompleted && item.completedByName && (
                        <span className="text-[10px] text-slate-500 block pt-1">
                          Verified by {item.completedByName} on {new Date(item.completedAt || '').toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit notes button */}
                  {!isContractor && closeout?.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setSelectedItemForNotes(item);
                        setItemNotes(item.notes || '');
                        setItemRefId(item.verifiedReferenceId || '');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 shrink-0"
                    >
                      Edit Notes
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Formal Project Closeout Sign-off</span>
              </h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are certifying that all governed closeout gates, structural reviews, quality clearances, and punch list remediations have been verified under Structura governance.
            </p>

            <form onSubmit={handleCompleteCloseout} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Final Closeout Governance Notes</label>
                <textarea
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  placeholder="Record formal closeout acceptance notes, executive remarks, or certificate references..."
                  rows={4}
                  required
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Certify Closeout Complete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <span>Return Closeout for Rectification</span>
              </h3>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReturnCloseout} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Reason for Return / Action Items Required</label>
                <textarea
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="Specify outstanding items, documentation discrepancies, or unverified work packages..."
                  rows={4}
                  required
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Returning...' : 'Return Closeout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Notes Modal */}
      {selectedItemForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <span>Edit Item Verification Notes</span>
              </h3>
              <button
                onClick={() => setSelectedItemForNotes(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl text-xs space-y-1">
              <p className="text-white font-bold">{selectedItemForNotes.title}</p>
              <p className="text-slate-400">{selectedItemForNotes.description}</p>
            </div>

            <form onSubmit={handleSaveItemDetails} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Verification Reference ID (Optional)</label>
                <input
                  type="text"
                  value={itemRefId}
                  onChange={e => setItemRefId(e.target.value)}
                  placeholder="e.g., ms-oasis-04, insp-demo-002, ev-demo-001"
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Verification Observations & Notes</label>
                <textarea
                  value={itemNotes}
                  onChange={e => setItemNotes(e.target.value)}
                  placeholder="Describe verification basis or link to formal record..."
                  rows={4}
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItemForNotes(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
