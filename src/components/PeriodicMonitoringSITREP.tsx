import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Plus, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  CloudSun, 
  Users, 
  DollarSign, 
  HardHat,
  Printer,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { 
  ConstructionProject, 
  MonitoringCadence, 
  PeriodicLogEntry, 
  SituationReport 
} from '../types';

interface PeriodicMonitoringSITREPProps {
  project: ConstructionProject;
  onUpdateProject: (updated: ConstructionProject) => void;
  onOpenAdvisorModal: () => void;
}

export const PeriodicMonitoringSITREP: React.FC<PeriodicMonitoringSITREPProps> = ({
  project,
  onUpdateProject,
  onOpenAdvisorModal,
}) => {
  const [activeCadence, setActiveCadence] = useState<MonitoringCadence | 'all'>('all');
  const [isGeneratingSITREP, setIsGeneratingSITREP] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [selectedSITREP, setSelectedSITREP] = useState<SituationReport | null>(
    project.situationReports[0] || null
  );

  // New Log Form State
  const [newLogCadence, setNewLogCadence] = useState<MonitoringCadence>('daily');
  const [newLogWeather, setNewLogWeather] = useState<PeriodicLogEntry['weather']>('Clear & Sunny (26°C)');
  const [newLogHeadcount, setNewLogHeadcount] = useState(24);
  const [newLogTrades, setNewLogTrades] = useState('Glazing Technicians (8), Waterproofing Crew (6), MEP Electricians (6), Site Engineers (4)');
  const [newLogTasks, setNewLogTasks] = useState('Completed anchor brackets on Level 2; installed 6 double-glazed panels; tested roof drain scuppers.');
  const [newLogMaterials, setNewLogMaterials] = useState('2 crates Schüco glazing units; 20 rolls waterproofing membrane');
  const [newLogSpend, setNewLogSpend] = useState(13500);
  const [newLogAuthor, setNewLogAuthor] = useState('Marcus Chen, Lead Site Engineer');
  const [newLogNotes, setNewLogNotes] = useState('All inspections cleared ahead of afternoon concrete delivery.');

  const filteredLogs = project.periodicLogs.filter(
    (log) => activeCadence === 'all' || log.cadence === activeCadence
  );

  const filteredSITREPs = project.situationReports.filter(
    (rep) => activeCadence === 'all' || rep.cadence === activeCadence
  );

  const handleGenerateAISITREP = async (periodCadence: MonitoringCadence) => {
    setIsGeneratingSITREP(true);
    try {
      const activePhase = 
        project?.milestones?.find((m) => m.status === 'In Progress') || 
        project?.milestones?.[0] || { name: 'Active Construction Phase' };
      const payload = {
        periodType: periodCadence,
        projectName: project?.name || 'Active Project',
        currentPhase: activePhase.name,
        logs: (project?.periodicLogs || []).slice(0, 5),
        budgetMetrics: {
          baseline: project?.totalBaselineBudgetUSD || 0,
          actual: project?.actualCostIncurredUSD || 0,
          forecast: project?.forecastAtCompletionUSD || 0,
        },
        daysLogged: project?.periodicLogs?.length || 0,
      };

      const res = await fetch('/api/ai/generate-sitrep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.sitrep) {
        const newSitrep: SituationReport = {
          id: data.sitrep.reportId || `SITREP-${periodCadence.toUpperCase()}-${Date.now().toString().slice(-4)}`,
          reportDate: new Date().toISOString().split('T')[0],
          cadence: periodCadence,
          executiveHeadline: data.sitrep.executiveHeadline,
          ownerConfidenceScore: data.sitrep.ownerConfidenceScore || 95,
          earnedValueAnalysis: data.sitrep.earnedValueAnalysis,
          keyAccomplishments: data.sitrep.keyAccomplishments,
          upcomingMilestones: data.sitrep.upcomingMilestones,
          budgetVarianceAlerts: data.sitrep.budgetVarianceAlerts,
          ownerActionItems: data.sitrep.ownerActionItems,
          preparedBy: 'Structura Chief Construction AI & Senior Project Director',
        };

        const updated = {
          ...project,
          confidenceScore: newSitrep.ownerConfidenceScore,
          situationReports: [newSitrep, ...project.situationReports],
        };
        onUpdateProject(updated);
        setSelectedSITREP(newSitrep);
      }
    } catch (err) {
      console.error('Failed to generate SITREP:', err);
    } finally {
      setIsGeneratingSITREP(false);
    }
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: PeriodicLogEntry = {
      id: `log-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      cadence: newLogCadence,
      weather: newLogWeather,
      manpowerHeadcount: Number(newLogHeadcount),
      activeTrades: newLogTrades.split(',').map((t) => t.trim()),
      tasksAccomplished: newLogTasks.split(';').map((t) => t.trim()),
      materialsReceived: newLogMaterials.split(';').map((m) => m.trim()),
      safetyIncidentsCount: 0,
      dailySpendUSD: Number(newLogSpend),
      author: newLogAuthor,
      notes: newLogNotes,
    };

    const updated = {
      ...project,
      actualCostIncurredUSD: project.actualCostIncurredUSD + Number(newLogSpend),
      periodicLogs: [newEntry, ...project.periodicLogs],
    };

    onUpdateProject(updated);
    setShowAddLogModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Periodic Cadence Filter */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-semibold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800">
                Periodic Monitoring Engine
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Real-Time Construction Logs & Situation Reports (SITREPs)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Daily site logs, weekly contractor rollups, fortnightly engineering audits, and monthly executive summaries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddLogModal(true)}
              className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Site Log</span>
            </button>

            {/* Synthesize SITREP dropdown / action */}
            <button
              onClick={() => handleGenerateAISITREP(activeCadence === 'all' ? 'weekly' : activeCadence)}
              disabled={isGeneratingSITREP}
              className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 min-h-[40px]"
            >
              {isGeneratingSITREP ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing SITREP...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate AI {activeCadence === 'all' ? 'Weekly' : activeCadence.toUpperCase()} SITREP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cadence Tabs */}
        <div className="flex items-center gap-1.5 border-t border-zinc-200 dark:border-zinc-800 pt-3 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Cadence:</span>
          </span>

          {(['all', 'daily', 'weekly', 'fortnightly', 'monthly'] as const).map((cadence) => {
            const isActive = activeCadence === cadence;
            return (
              <button
                key={cadence}
                onClick={() => setActiveCadence(cadence)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {cadence === 'all' ? 'All Periodic Logs' : `${cadence} Monitoring`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Structural Phase Progression & Material Deliveries Hub */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>3D Phase Progression & Material QA/QC Batch Deliveries</span>
            </h3>
            <p className="text-xs text-zinc-500">Live photographic verification and on-site material laboratory test reports</p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold self-start sm:self-auto">
            Active Phase: Phase {project.currentPhaseIndex + 1} of 6 (Glazing & Roof Deck)
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Phase 3D Schematic & Live Photographic Progress */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
              Active Stage Photo Logs
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(project.sitePhotos || []).slice(0, 2).map((photo) => (
                <div key={photo.id} className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video group">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <span className="text-[10px] text-white font-medium line-clamp-1">{photo.caption}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs">
              <span className="font-bold text-zinc-900 dark:text-white block mb-0.5">3D Envelope Tolerance Verification</span>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Laser point cloud scan confirms facade plumbness within ±1.2mm tolerance across 14 bays.
              </p>
            </div>
          </div>

          {/* On-Site Material Batch Quality Verifications */}
          <div className="lg:col-span-2 space-y-3">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
              Certified Material Batches Received On-Site
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Batch 1 */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Schüco AWS 75.SI+ Triple Glazed</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-mono font-bold">PASS (STC 44)</span>
                </div>
                <p className="text-[11px] text-zinc-500">Batch #GLZ-2026-88 • Low-E Argon 90% Fill • Thermal U: 0.8 W/m²K</p>
                <div className="text-[10px] text-zinc-400 font-mono">16 Units Verified & Placed in Laydown Yard B</div>
              </div>

              {/* Batch 2 */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Ready-Mix C35/45 Self-Compacting</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-mono font-bold">42.8 MPa (28d)</span>
                </div>
                <p className="text-[11px] text-zinc-500">Batch #CON-304 • Slump Flow 680mm • Certified by SGS Lab</p>
                <div className="text-[10px] text-zinc-400 font-mono">Level 2 Cantilever Slab Pour Cleared</div>
              </div>

              {/* Batch 3 */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Sika Sarnafil TS 77-20 Membrane</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-mono font-bold">ASTM D6878</span>
                </div>
                <p className="text-[11px] text-zinc-500">2.0mm Multi-Layer Synthetic FPO • Tensile Strength &gt;1000 N/50mm</p>
                <div className="text-[10px] text-zinc-400 font-mono">Roof Terrace Waterproofing Layer Ready</div>
              </div>

              {/* Batch 4 */}
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-900 dark:text-white">Jura Beige Limestone Cladding</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[9px] font-mono font-bold">EN 1469 Standard</span>
                </div>
                <p className="text-[11px] text-zinc-500">30mm Honed Slabs • Water Absorption 0.8% • Frost Resistant</p>
                <div className="text-[10px] text-zinc-400 font-mono">Delivered for Ground Portico Installation</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Left Column (Executive SITREP Dossier) & Right Column (Periodic Site Logs Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Executive Situation Report Dossier (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedSITREP ? (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200 print:bg-white print:text-black">
              {/* SITREP Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider border border-zinc-200 dark:border-zinc-800">
                      Official SITREP • {selectedSITREP.cadence.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">{selectedSITREP.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
                    Construction Situation Report & Owner Briefing
                  </h3>
                  <span className="text-xs text-zinc-500">Published: {selectedSITREP.reportDate}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Owner Confidence</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{selectedSITREP.ownerConfidenceScore}%</span>
                  </div>
                </div>
              </div>

              {/* Engineering Governance Notice */}
              <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20 text-[11px] text-blue-900 dark:text-blue-300 flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  AI-Assisted Executive SITREP Briefing
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px]">
                  Requires Senior Project Director verification prior to formal distribution
                </span>
              </div>

              {/* Executive Headline Callout */}
              <div className="bg-zinc-50 dark:bg-zinc-900/60 border-l-4 border-zinc-950 dark:border-white p-4 rounded-r-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">
                  Executive Assessment Headline
                </span>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed">
                  "{selectedSITREP.executiveHeadline}"
                </p>
              </div>

              {/* Earned Value Analysis EVM Metrics Grid */}
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                  <span>Earned Value Performance (EVM)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Cost Index (CPI)</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{selectedSITREP.earnedValueAnalysis.cpi}</span>
                    <span className="text-[9px] text-zinc-400 block">(&gt;1.0 Under budget)</span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Schedule Index (SPI)</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{selectedSITREP.earnedValueAnalysis.spi}</span>
                    <span className="text-[9px] text-zinc-400 block">(&gt;1.0 Ahead of time)</span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Net Cost Variance</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${Math.abs(selectedSITREP.earnedValueAnalysis.costVarianceAmount).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-zinc-400 block">Favorable Savings</span>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">Schedule Buffer</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      +{Math.abs(selectedSITREP.earnedValueAnalysis.scheduleVarianceDays)} Days
                    </span>
                    <span className="text-[9px] text-zinc-400 block">Ahead on Critical Path</span>
                  </div>
                </div>
              </div>

              {/* Key Accomplishments */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Key Completed Work Packages & Quality Milestones</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {selectedSITREP.keyAccomplishments.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Budget Variance Alerts */}
              {selectedSITREP.budgetVarianceAlerts && selectedSITREP.budgetVarianceAlerts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>AI-Driven Budget & Trade Variance Log</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedSITREP.budgetVarianceAlerts.map((alert, idx) => (
                      <div key={idx} className="bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 p-3 rounded-lg space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-800 dark:text-amber-300">{alert.trade}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/20">
                            {alert.status}
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">{alert.detail}</p>
                        <p className="text-zinc-500 text-[11px]">
                          <strong className="text-zinc-700 dark:text-zinc-300">Mitigation:</strong> {alert.actionTaken}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Action Items & Approvals Needed */}
              <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-zinc-900 dark:text-white" />
                  <span>Owner Decision & Milestone Sign-Off Actions</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {selectedSITREP.ownerActionItems.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-zinc-950 dark:text-white font-bold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer Sign-Off */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <span>Certified By: <strong className="text-zinc-800 dark:text-zinc-200">{selectedSITREP.preparedBy}</strong></span>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition border border-zinc-200 dark:border-zinc-800"
                >
                  <Printer className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Print SITREP</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center text-zinc-500 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-zinc-400" />
              <p className="text-sm">No SITREP generated yet for this filter.</p>
              <button
                onClick={() => handleGenerateAISITREP('weekly')}
                className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs"
              >
                Generate First Weekly SITREP
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Historical Logs Feed & Cadence Switcher (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Situation Reports Archive List */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors duration-200">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <span>Published Situation Reports ({project.situationReports.length})</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {project.situationReports.map((rep) => {
                const isSelected = selectedSITREP?.id === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedSITREP(rep)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-950 dark:text-white font-semibold'
                        : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {rep.cadence}
                        </span>
                        <span className="text-[11px] text-zinc-500">{rep.reportDate}</span>
                      </div>
                      <p className="text-xs line-clamp-1">{rep.executiveHeadline}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Periodic Site Logs Feed */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <span>On-Site Logbook Entries ({filteredLogs.length})</span>
              </h3>
              <span className="text-[10px] text-zinc-500">Chronological</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredLogs.map((log) => (
                <div key={log.id} className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {log.cadence}
                      </span>
                      <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{log.date}</span>
                    </div>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                      +${log.dailySpendUSD.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{log.weather}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span>{log.manpowerHeadcount} Crew</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block">Accomplished:</span>
                    <ul className="text-zinc-700 dark:text-zinc-300 space-y-0.5 list-disc list-inside">
                      {log.tasksAccomplished.map((t, idx) => (
                        <li key={idx} className="line-clamp-1">{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span>Logged by: {log.author}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Zero Incidents</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Log Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Record Site Logbook Entry</span>
              </h3>
              <button
                onClick={() => setShowAddLogModal(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Cadence Type</label>
                  <select
                    value={newLogCadence}
                    onChange={(e) => setNewLogCadence(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="daily">Daily Site Log</option>
                    <option value="weekly">Weekly Contractor Rollup</option>
                    <option value="fortnightly">Fortnightly Engineer Audit</option>
                    <option value="monthly">Monthly Executive Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Weather & Temperature</label>
                  <select
                    value={newLogWeather}
                    onChange={(e) => setNewLogWeather(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  >
                    <option value="Clear & Sunny (26°C)">Clear & Sunny (26°C)</option>
                    <option value="Overcast (19°C)">Overcast (19°C)</option>
                    <option value="Heavy Rain (14°C - Concrete Halted)">Heavy Rain (14°C - Halted)</option>
                    <option value="Windy (18°C)">Windy (18°C)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Headcount on Site</label>
                  <input
                    type="number"
                    value={newLogHeadcount}
                    onChange={(e) => setNewLogHeadcount(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Day / Period Spend (USD)</label>
                  <input
                    type="number"
                    value={newLogSpend}
                    onChange={(e) => setNewLogSpend(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Active Trades & Crew Distribution</label>
                <input
                  type="text"
                  value={newLogTrades}
                  onChange={(e) => setNewLogTrades(e.target.value)}
                  placeholder="e.g. Glaziers (8), Plumbers (6), Engineers (4)"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Tasks Accomplished (semicolon ; separated)</label>
                <textarea
                  rows={2}
                  value={newLogTasks}
                  onChange={(e) => setNewLogTasks(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Materials Delivered & Inspected</label>
                <input
                  type="text"
                  value={newLogMaterials}
                  onChange={(e) => setNewLogMaterials(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
