import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  AlertTriangle,
  Clock,
  ShieldCheck,
  UserCheck,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Tag,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { PunchItem, PunchItemCategory, PunchItemPriority, PunchItemStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PunchListPanelProps {
  projectId: string;
  userRole?: string;
}

export const PunchListPanel: React.FC<PunchListPanelProps> = ({ projectId, userRole }) => {
  const { user, idToken } = useAuth();
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals / Actions
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItemForResolution, setSelectedItemForResolution] = useState<PunchItem | null>(null);
  const [selectedItemForVerification, setSelectedItemForVerification] = useState<PunchItem | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<PunchItemCategory>('GENERAL');
  const [newPriority, setNewPriority] = useState<PunchItemPriority>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  // Resolution form state
  const [resolutionDescription, setResolutionDescription] = useState('');

  // Verification form state
  const [verificationDecision, setVerificationDecision] = useState<'VERIFIED' | 'REQUIRE_REWORK'>('VERIFIED');
  const [verificationNotes, setVerificationNotes] = useState('');

  const fetchPunchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/punch-items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch punch items');
      }
      setPunchItems(data.punchItems || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load punch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPunchItems();
  }, [projectId, idToken]);

  const handleCreatePunchItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    try {
      setSubmitting(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/punch-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          priority: newPriority,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create punch item');
      }

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      fetchPunchItems();
    } catch (err: any) {
      alert(err.message || 'Error creating punch item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForResolution || !resolutionDescription) return;

    try {
      setSubmitting(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/punch-items/${selectedItemForResolution.id}/resolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resolutionDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit resolution');
      }

      setSelectedItemForResolution(null);
      setResolutionDescription('');
      fetchPunchItems();
    } catch (err: any) {
      alert(err.message || 'Error submitting resolution');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyPunchItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForVerification || !verificationNotes) return;

    try {
      setSubmitting(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/punch-items/${selectedItemForVerification.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          decision: verificationDecision,
          verificationNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify punch item');
      }

      setSelectedItemForVerification(null);
      setVerificationNotes('');
      fetchPunchItems();
    } catch (err: any) {
      alert(err.message || 'Error verifying punch item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseItem = async (punchId: string) => {
    if (!confirm('Formally close this punch list item?')) return;

    try {
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/punch-items/${punchId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          closingNotes: 'Verified and formally closed under governed project closeout procedure.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to close punch item');
      }

      fetchPunchItems();
    } catch (err: any) {
      alert(err.message || 'Error closing punch item');
    }
  };

  const filteredItems = punchItems.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    return true;
  });

  const isContractor = userRole === 'GENERAL_CONTRACTOR';

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Completion Governance
            </span>
            <span className="text-xs text-slate-400">Sprint 05A</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <span>Outstanding Items & Punch List Register</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Track minor architectural finishing defects, MEP adjustments, and documentation actions. Separate from formal QA/QC Non-Conformance Reports (NCRs).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Punch Item</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Items</span>
          <span className="text-2xl font-black text-white">{punchItems.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Open / In Progress</span>
          <span className="text-2xl font-black text-amber-400">
            {punchItems.filter(p => p.status === 'OPEN' || p.status === 'ASSIGNED' || p.status === 'IN_PROGRESS').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Awaiting Verification</span>
          <span className="text-2xl font-black text-sky-400">
            {punchItems.filter(p => p.status === 'READY_FOR_VERIFICATION').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Verified & Closed</span>
          <span className="text-2xl font-black text-emerald-400">
            {punchItems.filter(p => p.status === 'VERIFIED' || p.status === 'CLOSED').length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 font-bold px-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="READY_FOR_VERIFICATION">Ready for Verification</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
        >
          <option value="ALL">All Categories</option>
          <option value="ARCHITECTURAL">Architectural</option>
          <option value="STRUCTURAL">Structural</option>
          <option value="MEP">MEP</option>
          <option value="FINISHING">Finishing</option>
          <option value="DOCUMENTATION">Documentation</option>
          <option value="SAFETY">Safety</option>
          <option value="GENERAL">General</option>
        </select>

        {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setPriorityFilter('ALL');
              setCategoryFilter('ALL');
            }}
            className="text-amber-400 hover:text-amber-300 font-bold px-2 py-1 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Punch Items List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/20 rounded-2xl border border-slate-800 animate-pulse">
          Loading punch items register...
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/20 rounded-2xl border border-slate-800">
          <CheckSquare className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="font-bold text-sm text-slate-300">No punch list items found</p>
          <p className="text-xs text-slate-500 mt-1">No items match your active filter criteria or none have been logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const isClosed = item.status === 'CLOSED';
            const isVerified = item.status === 'VERIFIED';
            const isReadyForVerification = item.status === 'READY_FOR_VERIFICATION';

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700">
                      {item.number}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {item.priority} Priority
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700/80">
                      {item.category}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isClosed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isVerified
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          : isReadyForVerification
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Logged {new Date(item.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                </div>

                {/* Raised / Assigned info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-xl text-xs text-slate-400">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Raised By</span>
                    <span className="text-slate-200 font-medium">
                      {item.raisedByName} ({item.raisedByRole})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Assigned To</span>
                    <span className="text-slate-200 font-medium">
                      {item.assignedToName ? `${item.assignedToName} (${item.assignedToRole})` : 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Resolution / Verification Details */}
                {item.resolutionDescription && (
                  <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-900/30 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Contractor Resolution Submitted</span>
                    </span>
                    <p className="text-slate-200">{item.resolutionDescription}</p>
                    <span className="text-[10px] text-slate-500 block">
                      Submitted by {item.resolvedByName} on {new Date(item.resolvedAt || '').toLocaleDateString()}
                    </span>
                  </div>
                )}

                {item.verificationNotes && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Professional Verification Audit</span>
                    </span>
                    <p className="text-slate-200">{item.verificationNotes}</p>
                    {item.verifiedByName && (
                      <span className="text-[10px] text-slate-500 block">
                        Verified by {item.verifiedByName} on {new Date(item.verifiedAt || '').toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                  {/* Resolution submission (Contractor or Assigned) */}
                  {(item.status === 'OPEN' || item.status === 'ASSIGNED' || item.status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => {
                        setSelectedItemForResolution(item);
                        setResolutionDescription('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs border border-sky-500/30 flex items-center gap-1.5 transition-all"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Submit Resolution</span>
                    </button>
                  )}

                  {/* Verification action (Director / Auditor / Owner) */}
                  {isReadyForVerification && (
                    <button
                      onClick={() => {
                        if (isContractor) {
                          alert('General Contractor cannot self-verify punch list resolutions. Verification requires Senior Project Director, Structural QA/QC Auditor, or Owner sign-off.');
                          return;
                        }
                        setSelectedItemForVerification(item);
                        setVerificationNotes('');
                        setVerificationDecision('VERIFIED');
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs border flex items-center gap-1.5 transition-all ${
                        isContractor
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Resolution</span>
                    </button>
                  )}

                  {/* Close action */}
                  {isVerified && !isClosed && (
                    <button
                      onClick={() => handleCloseItem(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Formally Close</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <span>Log Outstanding Punch List Item</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePunchItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., EPDM Seal Gap at North Facade Mullion"
                  required
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="ARCHITECTURAL">Architectural</option>
                    <option value="STRUCTURAL">Structural</option>
                    <option value="MEP">MEP</option>
                    <option value="FINISHING">Finishing</option>
                    <option value="DOCUMENTATION">Documentation</option>
                    <option value="SAFETY">Safety</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Description & Location</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Provide precise location, physical observation, and required corrective action..."
                  rows={4}
                  required
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Logging Item...' : 'Log Punch Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Submission Modal */}
      {selectedItemForResolution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-sky-400" />
                <span>Submit Corrective Resolution</span>
              </h3>
              <button
                onClick={() => setSelectedItemForResolution(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-mono">{selectedItemForResolution.number}</span>
              <p className="text-white font-bold">{selectedItemForResolution.title}</p>
            </div>

            <form onSubmit={handleSubmitResolution} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Resolution Work Completed</label>
                <textarea
                  value={resolutionDescription}
                  onChange={e => setResolutionDescription(e.target.value)}
                  placeholder="Describe the corrective action taken on site to resolve this punch item..."
                  rows={4}
                  required
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItemForResolution(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedItemForVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Professional Punch Verification</span>
              </h3>
              <button
                onClick={() => setSelectedItemForVerification(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl text-xs space-y-1">
              <span className="text-slate-400 font-mono">{selectedItemForVerification.number}</span>
              <p className="text-white font-bold">{selectedItemForVerification.title}</p>
              <p className="text-sky-300 mt-2">
                <strong>Resolution:</strong> {selectedItemForVerification.resolutionDescription}
              </p>
            </div>

            <form onSubmit={handleVerifyPunchItem} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Verification Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerificationDecision('VERIFIED')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      verificationDecision === 'VERIFIED'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified / Approved</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationDecision('REQUIRE_REWORK')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      verificationDecision === 'REQUIRE_REWORK'
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Require Rework</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Verification Notes & Findings</label>
                <textarea
                  value={verificationNotes}
                  onChange={e => setVerificationNotes(e.target.value)}
                  placeholder="Record on-site inspection observations, measurement checks, or reasons rework is required..."
                  rows={4}
                  required
                  className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedItemForVerification(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Record Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
