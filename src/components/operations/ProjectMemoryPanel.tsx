import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Sparkles,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ShieldCheck,
  Building2,
  FileText,
  Radio,
  Scale,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  ProjectMemoryEntry,
  AIMemorySummary,
  ProjectMemoryCategory,
  ProjectMemorySourceType,
  ProjectMilestone
} from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProjectMemoryPanelProps {
  projectId: string;
  isDemo?: boolean;
}

export const ProjectMemoryPanel: React.FC<ProjectMemoryPanelProps> = ({
  projectId,
  isDemo,
}) => {
  const { idToken } = useAuth();
  const [entries, setEntries] = useState<ProjectMemoryEntry[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<ProjectMemoryCategory>('ALL');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // AI Briefing State
  const [aiSummary, setAiSummary] = useState<AIMemorySummary | null>(null);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch Project Memory
  const fetchMemory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/projects/${projectId}/memory`;
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (selectedMilestoneId !== 'ALL') params.append('milestoneId', selectedMilestoneId);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load project memory records');
      }

      const data = await res.json();
      setEntries(data.entries || []);
    } catch (err: any) {
      setError(err.message || 'Error loading memory');
    } finally {
      setLoading(false);
    }
  }, [projectId, idToken, categoryFilter, selectedMilestoneId]);

  // Fetch Milestones for filter dropdown
  const fetchMilestones = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMilestones(data.milestones || []);
      }
    } catch {
      // Fallback
    }
  }, [projectId, idToken]);

  useEffect(() => {
    fetchMilestones();
    fetchMemory();
  }, [fetchMilestones, fetchMemory]);

  // Request AI Memory Briefing
  const handleGenerateAiBriefing = async () => {
    try {
      setGeneratingAi(true);
      setAiError(null);
      const res = await fetch(`/api/projects/${projectId}/memory/ai-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          milestoneId: selectedMilestoneId !== 'ALL' ? selectedMilestoneId : undefined,
          limitSources: 80,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'AI memory generation failed');
      }

      setAiSummary(data.summary);
    } catch (err: any) {
      setAiError(err.message || 'Failed to synthesize AI briefing');
    } finally {
      setGeneratingAi(false);
    }
  };

  const getSourceTypeBadge = (sourceType: ProjectMemorySourceType) => {
    switch (sourceType) {
      case 'PROJECT_DECISION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Scale className="w-2.5 h-2.5" />
            <span>DECISION</span>
          </span>
        );
      case 'QA_QC_INSPECTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>QA/QC</span>
          </span>
        );
      case 'NCR':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>NCR</span>
          </span>
        );
      case 'OWNER_DECISION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <Building2 className="w-2.5 h-2.5" />
            <span>OWNER</span>
          </span>
        );
      case 'AI_INSPECTION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>AI AUDIT</span>
          </span>
        );
      case 'RFI':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <FileText className="w-2.5 h-2.5" />
            <span>RFI</span>
          </span>
        );
      case 'DIRECT_LINE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30 flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" />
            <span>DIRECT LINE</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5" />
            <span>{sourceType}</span>
          </span>
        );
    }
  };

  const filteredEntries = entries.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q) ||
      e.actorName.toLowerCase().includes(q) ||
      e.sourceType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Project Memory Timeline</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Traceable, unified chronological view across all canonical project records, decisions, reviews, and verified quality states.
          </p>
        </div>

        <button
          id="btn-generate-ai-memory"
          onClick={handleGenerateAiBriefing}
          disabled={generatingAi}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md shrink-0 self-start sm:self-auto"
        >
          <Sparkles className={`w-4 h-4 ${generatingAi ? 'animate-spin' : ''}`} />
          <span>{generatingAi ? 'Analyzing Project Records...' : 'Synthesize AI Briefing'}</span>
        </button>
      </div>

      {/* AI Memory Synthesis Section */}
      {aiSummary && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#0c1c2e] to-[#0a1522] border border-amber-500/30 space-y-4 text-slate-200 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-white">Governed Project Memory Briefing</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {aiSummary.model}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>{aiSummary.referencedSourcesCount} records synthesized</span>
              <span>•</span>
              <span>{new Date(aiSummary.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Executive Briefing */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Executive Briefing
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5">
              {aiSummary.executiveBriefing}
            </p>
          </div>

          {/* Grid for progress, risks, and actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Milestone Progress */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Milestone Progress
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                {aiSummary.keyMilestoneProgress.length > 0 ? (
                  aiSummary.keyMilestoneProgress.map((item, i) => (
                    <li key={i} className="leading-snug">{item}</li>
                  ))
                ) : (
                  <li className="text-slate-500">No milestone changes recorded.</li>
                )}
              </ul>
            </div>

            {/* Active Risks & Blockers */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <span className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Active Risks & Blockers
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                {aiSummary.activeRisksAndBlockers.length > 0 ? (
                  aiSummary.activeRisksAndBlockers.map((item, i) => (
                    <li key={i} className="leading-snug text-rose-200/90">{item}</li>
                  ))
                ) : (
                  <li className="text-slate-500">No active blocking NCRs or hold points.</li>
                )}
              </ul>
            </div>

            {/* Pending Decisions & Actions */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 space-y-2">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Pending Decisions & Actions
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                {aiSummary.pendingDecisionsAndActions.length > 0 ? (
                  aiSummary.pendingDecisionsAndActions.map((item, i) => (
                    <li key={i} className="leading-snug text-amber-200/90">{item}</li>
                  ))
                ) : (
                  <li className="text-slate-500">All pending decision items resolved.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Grounding and Disclaimer */}
          <div className="pt-2 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-2">
            <span className="italic">{aiSummary.disclaimer}</span>
            <button
              onClick={() => setAiSummary(null)}
              className="text-slate-400 hover:text-white underline self-start sm:self-auto"
            >
              Dismiss Briefing
            </button>
          </div>
        </div>
      )}

      {aiError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{aiError}</span>
          </div>
          <button onClick={() => setAiError(null)} className="text-xs text-rose-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {(['ALL', 'GOVERNANCE', 'TECHNICAL', 'QUALITY', 'COMMUNICATION', 'FINANCIAL'] as ProjectMemoryCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium transition text-[11px] ${
                categoryFilter === cat
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Milestone & Search Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedMilestoneId}
            onChange={e => setSelectedMilestoneId(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">All Milestones</option>
            {milestones.map(m => (
              <option key={m.id} value={m.id}>
                MS-{m.sequence}: {m.title.slice(0, 25)}...
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="bg-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-500 w-36 sm:w-48 placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Memory Timeline List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading project memory records...</div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/30 border border-slate-800 text-center space-y-3">
          <History className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-sm">No Memory Records Match Filter</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Project memory compiles immutable canonical records from all operational domains. Adjust your filters to see historical events.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l border-slate-800 space-y-4">
          {filteredEntries.map(entry => {
            const isExpanded = expandedEntryId === entry.id;

            return (
              <div
                key={entry.id}
                className="relative group transition-all"
              >
                {/* Timeline node icon */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-4 h-4 rounded-full bg-slate-900 border-2 border-amber-500/60 group-hover:border-amber-400 flex items-center justify-center transition" />

                {/* Entry Card */}
                <div
                  onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                  className="rounded-2xl border border-slate-800/80 hover:border-slate-700 bg-slate-900/60 p-4 sm:p-5 transition cursor-pointer space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSourceTypeBadge(entry.sourceType)}
                      <span className="text-xs font-bold text-white tracking-tight">
                        {entry.title}
                      </span>
                      {entry.resultingState && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                          {entry.resultingState}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Summary preview */}
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {entry.summary}
                  </p>

                  {/* Actor and Category */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span>Actor: <strong className="text-slate-200">{entry.actorName}</strong> ({entry.actorRole})</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      ID: {entry.sourceId}
                    </span>
                  </div>

                  {/* Expanded Metadata Details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800 text-xs space-y-2 bg-slate-950/40 p-3 rounded-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Canonical Event Type</span>
                          <span className="font-mono text-slate-300">{entry.eventType}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Category Domain</span>
                          <span className="font-mono text-slate-300">{entry.category}</span>
                        </div>
                      </div>

                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Structured Payload Metadata
                          </span>
                          <pre className="text-[10px] font-mono text-slate-300 bg-black/40 p-2 rounded overflow-x-auto">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
