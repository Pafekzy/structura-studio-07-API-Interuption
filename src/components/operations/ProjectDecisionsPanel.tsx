import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  FileText,
  DollarSign,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Building2,
  XCircle,
  HelpCircle,
  ArrowRight,
  X
} from 'lucide-react';
import {
  ProjectDecision,
  ProjectDecisionStatus,
  ProjectDecisionCategory,
  ProjectDecisionOption,
  ProjectRole
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProjectDecisionsPanelProps {
  projectId: string;
  isDemo?: boolean;
}

export const ProjectDecisionsPanel: React.FC<ProjectDecisionsPanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { userProfile, user, idToken } = useAuth();
  const [decisions, setDecisions] = useState<ProjectDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<ProjectRole | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // New Decision Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState<ProjectDecisionCategory>('DESIGN_VARIATION');
  const [newDescription, setNewDescription] = useState('');
  const [newAuthorityRole, setNewAuthorityRole] = useState<ProjectRole>('SENIOR_PROJECT_DIRECTOR');
  const [newOptions, setNewOptions] = useState<ProjectDecisionOption[]>([
    {
      id: 'opt-A',
      title: 'Option A: Baseline Specification',
      description: 'Proceed with original contract technical specification.',
      costImpactUSD: 0,
      scheduleImpactDays: 0,
      isRecommended: true,
    },
    {
      id: 'opt-B',
      title: 'Option B: Accelerated Alternative',
      description: 'Expedite domestic certified fabrication with dual acoustic rating.',
      costImpactUSD: 45000,
      scheduleImpactDays: -14,
      isRecommended: false,
    },
  ]);
  const [submittingDraft, setSubmittingDraft] = useState(false);

  // Outcome Modal
  const [outcomeModalDecision, setOutcomeModalDecision] = useState<ProjectDecision | null>(null);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>('');
  const [outcomeDescription, setOutcomeDescription] = useState<string>('');
  const [governanceRationale, setGovernanceRationale] = useState<string>('');
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  // Supersede Modal
  const [supersedeModalDecision, setSupersedeModalDecision] = useState<ProjectDecision | null>(null);
  const [supersedeReason, setSupersedeReason] = useState<string>('');
  const [supersedeTitle, setSupersedeTitle] = useState<string>('');
  const [submittingSupersede, setSubmittingSupersede] = useState(false);

  // Fetch Project Access / Effective Role
  const fetchUserRole = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/access`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.effectiveRole || null);
      }
    } catch {
      // Fallback
    }
  }, [projectId, idToken]);

  // Fetch Decisions
  const fetchDecisions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/projects/${projectId}/decisions`;
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load project decisions');
      }

      const data = await res.json();
      setDecisions(data.decisions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading decisions');
    } finally {
      setLoading(false);
    }
  }, [projectId, idToken, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchUserRole();
    fetchDecisions();
  }, [fetchUserRole, fetchDecisions]);

  // Create Decision (Draft or Proposed)
  const handleCreateDecision = async (proposeImmediately: boolean) => {
    if (!newTitle.trim() || !newSubject.trim() || !newDescription.trim()) {
      alert('Please provide Title, Subject, and Description.');
      return;
    }

    try {
      setSubmittingDraft(true);
      const res = await fetch(`/api/projects/${projectId}/decisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          subject: newSubject.trim(),
          category: newCategory,
          description: newDescription.trim(),
          decisionAuthorityRole: newAuthorityRole,
          proposeImmediately,
          options: newOptions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create decision');
      }

      setShowNewModal(false);
      resetNewForm();
      await fetchDecisions();
    } catch (err: any) {
      alert(err.message || 'Error creating decision');
    } finally {
      setSubmittingDraft(false);
    }
  };

  // Submit Formal Outcome
  const handleRecordOutcome = async () => {
    if (!outcomeModalDecision) return;
    if (!outcomeDescription.trim() || !governanceRationale.trim()) {
      alert('Formal outcome and governance rationale are mandatory.');
      return;
    }

    try {
      setSubmittingOutcome(true);
      const res = await fetch(`/api/projects/${projectId}/decisions/${outcomeModalDecision.id}/outcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          selectedOptionId: selectedOutcomeId || undefined,
          selectedOutcome: outcomeDescription.trim(),
          rationale: governanceRationale.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to record decision outcome');
      }

      setOutcomeModalDecision(null);
      setSelectedOutcomeId('');
      setOutcomeDescription('');
      setGovernanceRationale('');
      await fetchDecisions();
    } catch (err: any) {
      alert(err.message || 'Error recording outcome');
    } finally {
      setSubmittingOutcome(false);
    }
  };

  // Supersede Decision
  const handleSupersede = async () => {
    if (!supersedeModalDecision) return;
    if (!supersedeReason.trim() || !supersedeTitle.trim()) {
      alert('Supersede reason and new decision title are required.');
      return;
    }

    try {
      setSubmittingSupersede(true);
      const res = await fetch(`/api/projects/${projectId}/decisions/${supersedeModalDecision.id}/supersede`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          supersededReason: supersedeReason.trim(),
          newDecision: {
            title: supersedeTitle.trim(),
            subject: `Superseding: ${supersedeModalDecision.subject}`,
            category: supersedeModalDecision.category,
            description: `Supersedes ${supersedeModalDecision.number}. Rationale: ${supersedeReason.trim()}`,
            decisionAuthorityRole: supersedeModalDecision.decisionAuthorityRole,
            proposeImmediately: true,
            options: supersedeModalDecision.options,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to supersede decision');
      }

      setSupersedeModalDecision(null);
      setSupersedeReason('');
      setSupersedeTitle('');
      await fetchDecisions();
    } catch (err: any) {
      alert(err.message || 'Error superseding decision');
    } finally {
      setSubmittingSupersede(false);
    }
  };

  const resetNewForm = () => {
    setNewTitle('');
    setNewSubject('');
    setNewDescription('');
    setNewCategory('DESIGN_VARIATION');
    setNewAuthorityRole('SENIOR_PROJECT_DIRECTOR');
  };

  const getStatusBadge = (status: ProjectDecisionStatus) => {
    switch (status) {
      case 'DECIDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>DECIDED</span>
          </span>
        );
      case 'PROPOSED':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>PROPOSED</span>
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
            <RotateCcw className="w-3 h-3 text-purple-400" />
            <span>SUPERSEDED</span>
          </span>
        );
      case 'VOIDED':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-red-400" />
            <span>VOIDED</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40 flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>DRAFT</span>
          </span>
        );
    }
  };

  const getCategoryBadge = (category: ProjectDecisionCategory) => {
    const formatted = category.replace(/_/g, ' ');
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
        {formatted}
      </span>
    );
  };

  const isUserAuthorizedForOutcome = (decision: ProjectDecision) => {
    if (!userRole) return false;
    if (decision.decisionAuthorityRole === 'OWNER_CLIENT') {
      return userRole === 'OWNER_CLIENT';
    }
    if (decision.decisionAuthorityRole === 'SENIOR_PROJECT_DIRECTOR') {
      return userRole === 'SENIOR_PROJECT_DIRECTOR' || userRole === 'OWNER_CLIENT';
    }
    return userRole === decision.decisionAuthorityRole;
  };

  return (
    <div className="space-y-6">
      {/* Panel Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Project Decisions Register</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Governed formal project decisions. Preserves alternatives, cost/schedule impacts, rationale, and authority boundaries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-new-project-decision"
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Draft New Decision</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {['ALL', 'PROPOSED', 'DECIDED', 'SUPERSEDED', 'DRAFT'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Categories</option>
            <option value="MATERIAL_SELECTION">Material Selection</option>
            <option value="DESIGN_VARIATION">Design Variation</option>
            <option value="SCHEDULE_ADJUSTMENT">Schedule Adjustment</option>
            <option value="BUDGET_CONTINGENCY">Budget Contingency</option>
            <option value="QUALITY_COMPLIANCE">Quality Compliance</option>
            <option value="SITE_LOGISTICS">Site Logistics</option>
            <option value="PROCUREMENT_STRATEGY">Procurement Strategy</option>
            <option value="GENERAL_GOVERNANCE">General Governance</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Decisions List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading project decisions...</div>
      ) : decisions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/30 border border-slate-800 text-center space-y-3">
          <Scale className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-sm">No Decisions in Register</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Formal project decisions document evaluated options, authority rationale, and selected engineering or scope paths.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {decisions.map(decision => {
            const canDecide = decision.status === 'PROPOSED' && isUserAuthorizedForOutcome(decision);
            const canSupersede = decision.status === 'DECIDED' && isUserAuthorizedForOutcome(decision);

            return (
              <div
                key={decision.id}
                id={`decision-card-${decision.number.toLowerCase()}`}
                className={`rounded-2xl border transition-all p-5 sm:p-6 bg-slate-900/70 ${
                  decision.status === 'DECIDED'
                    ? 'border-emerald-500/30'
                    : decision.status === 'SUPERSEDED'
                    ? 'border-purple-500/30 opacity-75'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {decision.number}
                      </span>
                      {getStatusBadge(decision.status)}
                      {getCategoryBadge(decision.category)}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(decision.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {decision.title}
                    </h3>
                    <p className="text-xs font-medium text-amber-300/90">
                      Subject: {decision.subject}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start">
                    {/* Authority badge */}
                    <div className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Authority: <strong className="text-white">{decision.decisionAuthorityRole}</strong></span>
                    </div>

                    {canDecide && (
                      <button
                        onClick={() => {
                          setOutcomeModalDecision(decision);
                          if (decision.options && decision.options.length > 0) {
                            const rec = decision.options.find(o => o.isRecommended) || decision.options[0];
                            setSelectedOutcomeId(rec.id);
                            setOutcomeDescription(rec.title);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Record Outcome</span>
                      </button>
                    )}

                    {canSupersede && (
                      <button
                        onClick={() => {
                          setSupersedeModalDecision(decision);
                          setSupersedeTitle(`Superseding ${decision.number}: Revised Specification`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold text-xs transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Supersede</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="py-3 text-xs text-slate-300 leading-relaxed">
                  {decision.description}
                </div>

                {/* Options Evaluated */}
                {decision.options && decision.options.length > 0 && (
                  <div className="mt-2 space-y-2 border-t border-slate-800/80 pt-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Options & Alternatives Evaluated ({decision.options.length})
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {decision.options.map((opt, idx) => {
                        const isSelected = decision.selectedOptionId === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-slate-700 text-[10px] flex items-center justify-center font-mono">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                {opt.title}
                              </span>
                              {opt.isRecommended && (
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Recommended
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Selected
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400">{opt.description}</p>

                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-700/40">
                              <span>Cost: {(opt.costImpactUSD ?? 0) > 0 ? `+$${(opt.costImpactUSD ?? 0).toLocaleString()}` : '$0'}</span>
                              <span>Schedule: {(opt.scheduleImpactDays ?? 0) !== 0 ? `${opt.scheduleImpactDays}d` : '0d'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Outcome & Rationale Section (When DECIDED) */}
                {decision.status === 'DECIDED' && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Formal Governance Decision Outcome
                      </span>
                      <span className="text-[10px] text-emerald-400/80 font-mono">
                        Decided by {decision.decisionAuthorityName || 'Authority'} ({decision.decisionAuthorityRole}) • {new Date(decision.decidedAt!).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-white">
                      Outcome: {decision.selectedOutcome}
                    </p>

                    {decision.rationale && (
                      <div className="text-xs text-emerald-200/90 bg-emerald-900/20 p-2.5 rounded-lg border border-emerald-500/20">
                        <strong className="text-emerald-300 block mb-0.5">Governance Rationale:</strong>
                        {decision.rationale}
                      </div>
                    )}
                  </div>
                )}

                {/* Superseded Notice */}
                {decision.status === 'SUPERSEDED' && (
                  <div className="mt-3 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                      <span>Decision Superseded</span>
                      {decision.supersededByDecisionId && (
                        <span className="font-mono text-purple-200">
                          by {decision.supersededByDecisionId}
                        </span>
                      )}
                    </div>
                    {decision.supersededReason && (
                      <p className="text-[11px] text-purple-200/80">
                        Reason: {decision.supersededReason}
                      </p>
                    )}
                  </div>
                )}

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                  <span>
                    Proposed by: <strong className="text-slate-200">{decision.proposedByName}</strong> ({decision.proposedByRole})
                  </span>
                  {decision.relatedRecordRefs && decision.relatedRecordRefs.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500">Related:</span>
                      {decision.relatedRecordRefs.map(ref => (
                        <span key={ref.entityId} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {ref.referenceCode || ref.title || ref.entityId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Decision Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e1a2b] border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Draft Governed Decision</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Decision Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g., Curtain Wall Thermal Spec Modification"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Decision Subject *</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="e.g., Substitute imported extrusions with domestic acoustic-rated profiles"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as ProjectDecisionCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MATERIAL_SELECTION">Material Selection</option>
                    <option value="DESIGN_VARIATION">Design Variation</option>
                    <option value="SCHEDULE_ADJUSTMENT">Schedule Adjustment</option>
                    <option value="BUDGET_CONTINGENCY">Budget Contingency</option>
                    <option value="QUALITY_COMPLIANCE">Quality Compliance</option>
                    <option value="SITE_LOGISTICS">Site Logistics</option>
                    <option value="PROCUREMENT_STRATEGY">Procurement Strategy</option>
                    <option value="GENERAL_GOVERNANCE">General Governance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Decision Authority Role *</label>
                  <select
                    value={newAuthorityRole}
                    onChange={e => setNewAuthorityRole(e.target.value as ProjectRole)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="SENIOR_PROJECT_DIRECTOR">SENIOR_PROJECT_DIRECTOR</option>
                    <option value="OWNER_CLIENT">OWNER_CLIENT</option>
                    <option value="STRUCTURAL_QA_QC_AUDITOR">STRUCTURAL_QA_QC_AUDITOR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Detailed Governance Description *</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide technical context, site constraints, and reasons for governance action..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Options Summary */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block">Configured Options ({newOptions.length})</span>
                {newOptions.map((opt, i) => (
                  <div key={opt.id} className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-1">
                    <span><strong>Option {String.fromCharCode(65 + i)}:</strong> {opt.title}</span>
                    <span className="font-mono text-slate-500">+${(opt.costImpactUSD ?? 0).toLocaleString()} / {opt.scheduleImpactDays}d</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={submittingDraft}
                onClick={() => handleCreateDecision(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
              >
                Save as Draft
              </button>
              <button
                disabled={submittingDraft}
                onClick={() => handleCreateDecision(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md"
              >
                {submittingDraft ? 'Proposing...' : 'Propose to Authority'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Outcome Modal */}
      {outcomeModalDecision && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e1a2b] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Record Formal Decision Outcome</h3>
              </div>
              <button
                onClick={() => setOutcomeModalDecision(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                <span className="font-mono text-amber-400 font-bold">{outcomeModalDecision.number}</span>
                <h4 className="font-bold text-white text-sm">{outcomeModalDecision.title}</h4>
                <p className="text-slate-400 text-[11px]">{outcomeModalDecision.subject}</p>
              </div>

              {outcomeModalDecision.options && outcomeModalDecision.options.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Winning Option</label>
                  <select
                    value={selectedOutcomeId}
                    onChange={e => {
                      setSelectedOutcomeId(e.target.value);
                      const opt = outcomeModalDecision.options?.find(o => o.id === e.target.value);
                      if (opt) setOutcomeDescription(opt.title);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Custom Outcome --</option>
                    {outcomeModalDecision.options.map((opt, idx) => (
                      <option key={opt.id} value={opt.id}>
                        Option {String.fromCharCode(65 + idx)}: {opt.title} ({(opt.costImpactUSD ?? 0) > 0 ? `+$${(opt.costImpactUSD ?? 0).toLocaleString()}` : '$0'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Formal Selected Outcome *</label>
                <input
                  type="text"
                  value={outcomeDescription}
                  onChange={e => setOutcomeDescription(e.target.value)}
                  placeholder="e.g., Adopt Option B with domestic acoustic-rated profiles"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Formal Governance Rationale *</label>
                <textarea
                  value={governanceRationale}
                  onChange={e => setGovernanceRationale(e.target.value)}
                  rows={3}
                  placeholder="Explain why this decision was approved under your project authority, citing code, cost, or schedule impacts..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setOutcomeModalDecision(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={submittingOutcome}
                onClick={handleRecordOutcome}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submittingOutcome ? 'Recording...' : 'Register Formal Decision'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supersede Modal */}
      {supersedeModalDecision && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e1a2b] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">Supersede Prior Decision</h3>
              </div>
              <button
                onClick={() => setSupersedeModalDecision(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-500/30 text-purple-200 space-y-1">
                <p>
                  You are superseding <strong>{supersedeModalDecision.number}: {supersedeModalDecision.title}</strong>.
                  This will mark the existing decision as SUPERSEDED and create an active successor record.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Successor Decision Title *</label>
                <input
                  type="text"
                  value={supersedeTitle}
                  onChange={e => setSupersedeTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Superseding *</label>
                <textarea
                  value={supersedeReason}
                  onChange={e => setSupersedeReason(e.target.value)}
                  rows={3}
                  placeholder="Specify changed site conditions, new structural calculations, or revised Owner instructions..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSupersedeModalDecision(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={submittingSupersede}
                onClick={handleSupersede}
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{submittingSupersede ? 'Superseding...' : 'Supersede & Create Successor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
