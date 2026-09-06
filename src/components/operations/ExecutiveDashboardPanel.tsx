import React, { useState, useEffect } from 'react';
import {
  ExecutiveProjectReport,
  AIExecutiveBriefing,
  ProjectHealthStatus,
  ProjectHealthFactor,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  Sparkles,
  RefreshCw,
  Printer,
  ChevronRight,
  Clock,
  Layers,
  Award,
  AlertCircle,
  HelpCircle,
  BarChart3,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

interface ExecutiveDashboardPanelProps {
  projectId: string;
  userRole?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const ExecutiveDashboardPanel: React.FC<ExecutiveDashboardPanelProps> = ({
  projectId,
  userRole,
  onNavigateToTab,
}) => {
  const { user, idToken } = useAuth();
  const [report, setReport] = useState<ExecutiveProjectReport | null>(null);
  const [briefing, setBriefing] = useState<AIExecutiveBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/executive-report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate executive report');
      }
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiBriefing = async () => {
    try {
      setBriefingLoading(true);
      const token = idToken || '';
      const res = await fetch(`/api/projects/${projectId}/ai-executive-briefing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to synthesize AI executive briefing');
      }
      setBriefing(data.briefing);
    } catch (err: any) {
      alert(err.message || 'Error generating AI briefing');
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [projectId, idToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-slate-600 text-sm">Aggregating Canonical Project Governance State...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
        <div>
          <h4 className="font-bold">Failed to load Executive Dashboard</h4>
          <p className="text-xs text-rose-700 mt-1">{error || 'Unknown error occurred.'}</p>
          <button
            onClick={fetchReport}
            className="mt-3 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
          >
            Retry Report Generation
          </button>
        </div>
      </div>
    );
  }

  const { health, progress, risks, financialGovernance, punchItemCounts } = report;

  const getHealthBadge = (status: ProjectHealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            HEALTHY ({health.overallScore}/100)
          </span>
        );
      case 'ATTENTION_REQUIRED':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
            ATTENTION REQUIRED ({health.overallScore}/100)
          </span>
        );
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600" />
            AT RISK ({health.overallScore}/100)
          </span>
        );
      case 'BLOCKED':
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600" />
            BLOCKED ({health.overallScore}/100)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
              <LayoutDashboard className="w-4 h-4 text-indigo-600" />
              Executive Visibility & Health Dashboard
            </div>
            <h2 className="text-xl font-bold text-slate-900">{report.projectName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic governance aggregation • Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {getHealthBadge(health.overallStatus)}
            <button
              onClick={fetchReport}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Refresh Executive Aggregations"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
          </div>
        </div>

        {/* Executive Action Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            {health.executiveSummary}
          </div>

          <button
            onClick={handleGenerateAiBriefing}
            disabled={briefingLoading}
            className="px-4 py-2 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {briefingLoading ? 'Synthesizing Briefing...' : 'Generate AI Executive Briefing'}
          </button>
        </div>
      </div>

      {/* AI Briefing Panel (If generated) */}
      {briefing && (
        <div className="bg-linear-to-br from-indigo-950 via-slate-900 to-slate-900 text-white rounded-xl shadow-lg border border-indigo-500/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  AI-Generated Executive Project Briefing
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/20">
                    {briefing.model}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Synthesized from {briefing.referencedSourcesCount} canonical governance records • {new Date(briefing.generatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
              Grounded AI Synthesis
            </span>
          </div>

          <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-xs text-slate-200 leading-relaxed">
            {briefing.executiveBriefing}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Progress Highlights
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {briefing.progressHighlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Key Risks & Critical Blockers
              </h4>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                {briefing.keyRisksAndBlockers.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 bg-amber-950/40 rounded-lg border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Closeout & Handover Diagnosis:</strong> {briefing.closeoutAndHandoverReadiness}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic pt-2 border-t border-white/10">
            {briefing.disclaimer}
          </div>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Milestone Progress */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Milestone Progress</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{progress.percentMilestonesApproved}%</span>
            <span className="text-xs text-slate-500">
              ({progress.completedCount}/{progress.totalMilestones} approved)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentMilestonesApproved}%` }}
            />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{progress.inProgressCount} in progress</span>
            <span>{progress.blockedCount} blocked</span>
          </div>
        </div>

        {/* QA/QC & NCRs */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>QA/QC & NCR Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{risks.totalOpenNCRs}</span>
            <span className="text-xs text-slate-500">open NCR(s)</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            {risks.blockingNCRsCount > 0 ? (
              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[11px]">
                {risks.blockingNCRsCount} Critical Blocker(s)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                No Critical NCRs
              </span>
            )}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>{risks.failedQAQCCount} held/failed inspections</span>
          </div>
        </div>

        {/* Punch List Status */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Outstanding Punch Items</span>
            <FileCheck2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {punchItemCounts.open + punchItemCounts.assigned + punchItemCounts.inProgress}
            </span>
            <span className="text-xs text-slate-500">of {punchItemCounts.total} pending</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
              {punchItemCounts.readyForVerification} ready for verify
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
              {punchItemCounts.closed} closed
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            {punchItemCounts.critical} high priority items
          </div>
        </div>

        {/* Financial Governance */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Financial Processing</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{progress.percentMilestonesFinanciallyAuthorized}%</span>
            <span className="text-xs text-slate-500">authorized</span>
          </div>
          <div className="mt-3 text-xs text-slate-700 font-semibold">
            ${financialGovernance.authorizedForFinancialProcessingUSD.toLocaleString()} / ${financialGovernance.costAllocationTotalUSD.toLocaleString()}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 truncate" title={financialGovernance.note}>
            Technical authorization boundary (No BMONI)
          </div>
        </div>
      </div>

      {/* Health Breakdown by Governance Factor */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Multi-Factor Project Health Diagnosis (Weighted Governance Criteria)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {health.factors.map(factor => (
            <div
              key={factor.id}
              className={`p-4 rounded-xl border text-xs flex flex-col justify-between ${
                factor.status === 'OPTIMAL'
                  ? 'bg-slate-50/50 border-slate-200'
                  : factor.status === 'BLOCKED' || factor.status === 'CRITICAL'
                  ? 'bg-rose-50/40 border-rose-200'
                  : 'bg-amber-50/40 border-amber-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">{factor.name}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      factor.status === 'OPTIMAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : factor.status === 'BLOCKED' || factor.status === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {factor.status} • {factor.score}/100
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed mb-2">{factor.summary}</p>
              </div>

              {factor.details && factor.details.length > 0 && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                  {factor.details.slice(0, 2).map((d, idx) => (
                    <div key={idx} className="truncate">• {d}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risks & Issues Active Register */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Project Risk & Exception Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-severity non-conformances, held inspections, critical punch items, and unresolved decisions.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
            {risks.items.length} Active Exception(s)
          </span>
        </div>

        {risks.items.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800">No active governance exceptions</p>
            <p className="text-xs text-slate-500 mt-0.5">All QA/QC inspections, NCRs, and punch items are clear.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {risks.items.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : item.severity === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{item.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  <p className="text-xs text-indigo-700 font-medium mt-1.5 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <strong>Action Required:</strong> {item.actionRequired}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Truthful Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <strong>Governance & Truthfulness Notice:</strong> {report.disclaimer}
      </div>
    </div>
  );
};
