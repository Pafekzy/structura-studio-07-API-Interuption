import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Layers, 
  Camera, 
  FileText, 
  Building2, 
  HardHat, 
  ArrowRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { ConstructionProject, UserRole } from '../types';

interface ExecutiveOverviewProps {
  project: ConstructionProject;
  activeRole: UserRole;
  onNavigateTab: (tab: string) => void;
  onOpenAdvisorModal: () => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  project,
  activeRole,
  onNavigateTab,
  onOpenAdvisorModal,
}) => {
  const varianceAmount = project.forecastAtCompletionUSD - project.totalBaselineBudgetUSD;
  const isOverBudget = varianceAmount > 0;
  const variancePct = ((Math.abs(varianceAmount) / project.totalBaselineBudgetUSD) * 100).toFixed(1);

  const milestones = project?.milestones || [];
  const activeMilestone = 
    milestones.find((m) => m.status === 'In Progress') || 
    milestones[0] || {
      id: 'default-ms',
      name: 'Initial Project Planning & Site Prep',
      phaseOrder: 1,
      plannedStartDate: project?.startDate || new Date().toISOString().split('T')[0],
      plannedEndDate: project?.targetHandoverDate || new Date().toISOString().split('T')[0],
      status: 'In Progress' as const,
      progressPercentage: project?.overallProgressPercentage || 0,
      costAllocationUSD: Math.round((project?.totalBaselineBudgetUSD || 0) * 0.15),
      payoutApproved: false,
      escrowStatus: 'Pending Sign-Off' as const,
      certificationsRequired: ['Site Engineering Clearance'],
      certificationsCleared: true,
      contractorClaimUSD: 0,
    };
  const completedMilestonesCount = milestones.filter((m) => m.status === 'Completed').length;
  const totalMilestonesCount = milestones.length || 1;

  const latestSITREP = project?.situationReports?.[0];
  const latestPhoto = project?.sitePhotos?.[0];

  return (
    <div className="space-y-6">
      {/* Top Executive Header Card */}
      <div className="bg-white/90 dark:bg-[#0a1523]/90 backdrop-blur-md border border-slate-200 dark:border-[#1a324d] rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden transition-colors duration-200">
        {/* Animated Framer Motion Glow Background Accent */}
        <motion.div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-amber-500/10 dark:bg-amber-500/15 blur-3xl pointer-events-none"
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-[#1E3E62]/15 dark:bg-[#1E3E62]/30 blur-3xl pointer-events-none"
          animate={{
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/25 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Executive Owner Oversight Active</span>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">ID: {project.id}</span>
              <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate">{project.location}</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight break-words">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Client: <strong className="text-slate-800 dark:text-slate-200">{project.clientName}</strong></span>
              <span>•</span>
              <span>Lead Contractor: <strong className="text-slate-800 dark:text-slate-200">{project.contractorName}</strong></span>
            </p>
          </div>

          {/* Owner Health & Confidence Score Widget */}
          <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-[#0d1e32] p-3 sm:p-3.5 rounded-xl border border-slate-200 dark:border-[#1b3654] w-full sm:w-auto shrink-0 shadow-sm">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-14 h-14 sm:w-16 sm:h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-200 dark:text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (163.3 * project.confidenceScore) / 100}
                  className="text-amber-500 transition-all duration-1000 ease-out"
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{project.confidenceScore}%</span>
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block uppercase tracking-wider">
                Health Index
              </span>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Zero Structural Deficiencies</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Updated live via AI SITREPs</span>
            </div>
          </div>
        </div>

        {/* Executive Headline from Latest SITREP */}
        {latestSITREP && (
          <div className="mt-4 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-[#0e2136] border border-slate-200 dark:border-[#1a3452] flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 dark:text-white mr-2 uppercase tracking-wide">Latest SITREP Synthesis:</span>
              <span className="text-zinc-700 dark:text-zinc-300">{latestSITREP.executiveHeadline}</span>
            </div>
          </div>
        )}

        {/* Quick Launch Stakeholder Dashboards Strip */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1.5">
              <span>Stakeholder Portals & Dedicated Routes:</span>
            </span>
            <button
              onClick={() => onNavigateTab('stakeholder_hub')}
              className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline self-start sm:self-auto flex items-center gap-1"
            >
              <span>View All 4 Portals</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => onNavigateTab('stakeholder_owner')}
              className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-amber-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">Owner Portal</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Escrow & ROI</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('stakeholder_director')}
              className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-blue-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">Project Director</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Critical Path & RFIs</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('stakeholder_contractor')}
              className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-amber-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block">General Contractor</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Daily Site Field Ops</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
            </button>

            <button
              onClick={() => onNavigateTab('stakeholder_qaqc')}
              className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-emerald-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 text-left transition flex items-center justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Structural QA/QC</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white">Lab Breaks & Plumbness</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial & Timeline KPI Cards (Next.js dashboard style with visible motion) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Baseline Budget */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 transition-colors duration-200"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Baseline Budget</span>
            <DollarSign className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-mono">
            ${project.totalBaselineBudgetUSD.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 flex items-center justify-between">
            <span>Locked BOQ Contract</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-300">Phase 1-6</span>
          </div>
        </motion.div>

        {/* Forecast At Completion & Variance */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 transition-colors duration-200"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Forecast at Completion (EAC)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-mono">
            ${project.forecastAtCompletionUSD.toLocaleString()}
          </div>
          <div className="text-[11px] flex items-center gap-1 font-semibold">
            {isOverBudget ? (
              <>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  +${varianceAmount.toLocaleString()} ({variancePct}%) Projected Variance
                </span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Within Planned Contingency</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Physical Construction Progress */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 transition-colors duration-200"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Physical Progress</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-mono">
            {project.overallProgressPercentage}%
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.overallProgressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-zinc-900 dark:bg-white h-full rounded-full"
            />
          </div>
        </motion.div>

        {/* Milestones & Handover */}
        <motion.div 
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-2 transition-colors duration-200"
        >
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
            <span className="font-medium uppercase tracking-wider">Milestones & Handover</span>
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
            {completedMilestonesCount} / {totalMilestonesCount} Cleared
          </div>
          <div className="text-[11px] text-zinc-500 truncate">
            Target: <span className="font-medium text-zinc-800 dark:text-zinc-200">{project.targetHandoverDate}</span>
          </div>
        </motion.div>
      </div>

      {/* Main Row: S-Curve EVM Graph vs Current Active Phase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* S-Curve Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>Earned Value Management (EVM) S-Curve Ledger</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Planned Value (PV) vs. Actual Cost of Work Performed (ACWP) vs. Earned Value (EV)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                CPI: 0.98 | SPI: 1.02
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={project.curveData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-800" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="plannedBudget"
                  name="Planned Value (Baseline PV)"
                  stroke="#71717a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#colorPlanned)"
                />
                <Area
                  type="monotone"
                  dataKey="actualSpent"
                  name="Actual Cost (ACWP)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                />
                <Area
                  type="monotone"
                  dataKey="earnedValue"
                  name="Earned Value (EV)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEarned)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Active Phase & Quick Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Active Phase Card */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4 transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
              <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-zinc-900 dark:text-white" />
                <span>Current Active Stage</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                Phase {activeMilestone.phaseOrder} of {totalMilestonesCount}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{activeMilestone.name}</h4>
              <p className="text-xs text-zinc-500 mt-1">
                Target Sign-off: <span className="font-mono text-zinc-700 dark:text-zinc-300">{activeMilestone.plannedEndDate}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Stage Progress</span>
                <span className="font-bold text-zinc-900 dark:text-white">{activeMilestone.progressPercentage}%</span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-zinc-950 dark:bg-white h-full rounded-full"
                  style={{ width: `${activeMilestone.progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
              <span className="text-zinc-500 block">Milestone Escrow Payout:</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  ${activeMilestone.costAllocationUSD.toLocaleString()}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                  {activeMilestone.escrowStatus}
                </span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('budget')}
              className="w-full py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold transition border border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Review & Sign-Off Milestone Payout</span>
            </button>
          </div>

          {/* Latest Site Inspection Snapshot */}
          {latestPhoto && (
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-500" />
                  <span>Active Site Photo (In-Progress)</span>
                </span>
                <span className="text-[10px] text-zinc-500">{new Date(latestPhoto.timestamp).toLocaleDateString()}</span>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video group">
                <img
                  src={latestPhoto.imageUrl}
                  alt={latestPhoto.zone}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-white text-[11px] font-medium truncate">{latestPhoto.zone}</span>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('inspection')}
                className="w-full py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <span>Launch Multimodal AI Vision Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 360 Proposed & Finished Building Visualizer Card with Multi-View Toggle */}
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Finished 3D Architectural View</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-mono font-medium">
                Photorealistic Turnkey
              </span>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-video group">
              <img
                src={project.finishedBuildingRenderUrl || latestPhoto?.imageUrl}
                alt="3D Turnkey Finished Villa Render"
                className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-between p-3">
                <div>
                  <span className="text-white text-xs font-bold block">{project.name}</span>
                  <span className="text-zinc-300 text-[10px]">{project.floorPlanSpecs.buildingStyle} • {project.materialSpecs.structuralCore}</span>
                </div>
                <button
                  onClick={() => onNavigateTab('finished_render')}
                  className="text-[11px] px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold transition shadow-sm"
                >
                  360° Studio
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase">Gross Floor Area</span>
                <span className="font-bold text-zinc-900 dark:text-white">{project.floorPlanSpecs.grossFloorAreaSqm} m² ({project.floorPlanSpecs.floors} Storeys)</span>
              </div>
              <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase">Energy Rating</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Net-Zero Ready</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('finished_render')}
              className="w-full py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <span>Explore 3D Architectural Systems & Swatches</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Finished 3D Architectural Systems & Material Specifications Overview Strip */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span>Finished 3D Architectural Systems & Material Specifications</span>
            </h3>
            <p className="text-xs text-zinc-500">Engineered structural cores, thermal envelopes, and luxury material assemblies</p>
          </div>
          <button
            onClick={() => onNavigateTab('finished_render')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Material Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
          {/* Facade & Glazing */}
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Envelope & Facade</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-mono text-[9px]">U-Val: 0.18</span>
            </div>
            <div className="font-bold text-zinc-900 dark:text-white">{project.materialSpecs.facadeType}</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Honed Jura limestone rain-screen with Reynaers Hi-Finity triple-glazed low-iron sliding panels.
            </p>
          </div>

          {/* Structural Core & Slab */}
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Structural Skeleton</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[9px]">Grade S355</span>
            </div>
            <div className="font-bold text-zinc-900 dark:text-white">{project.materialSpecs.structuralCore}</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Post-tensioned suspended concrete slabs with cantilevered upper terraces and hybrid steel framing.
            </p>
          </div>

          {/* Substructure Foundation */}
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Foundation Engineering</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[9px]">35 MPa C40</span>
            </div>
            <div className="font-bold text-zinc-900 dark:text-white">{project.materialSpecs.foundationType}</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Deep bored reinforced concrete piling (dia 600mm, depth 14m) anchored into dense bedrock.
            </p>
          </div>

          {/* Roofing & Solar Generation */}
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Roofing & Solar PV</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 font-mono text-[9px]">18 kWp Grid</span>
            </div>
            <div className="font-bold text-zinc-900 dark:text-white">{project.materialSpecs.roofType}</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Dual-layer SBS waterproofing with integrated monocrystalline glass solar panels and sedum green deck.
            </p>
          </div>

          {/* MEP & Microgrid Tier */}
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">MEP Tier</span>
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-mono text-[9px]">MERV 16 ERV</span>
            </div>
            <div className="font-bold text-zinc-900 dark:text-white">{project.materialSpecs.mepTier}</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Geothermal ground-source heat pump, multi-zone VRF HVAC, and 20kWh lithium iron phosphate battery backup.
            </p>
          </div>

          {/* Interior Finishes & Millwork */}
          <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Interior Grade</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono text-[9px]">Bespoke</span>
            </div>
            <div className="font-bold text-zinc-900 dark:text-white">{project.materialSpecs.interiorGrade}</div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Calacatta Borghini marble, custom walnut architectural joinery, chevron white oak, and Lutron automation.
            </p>
          </div>
        </div>
      </div>

      {/* Milestone Roadmap Progression Bar */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
              Project Lifecycle Milestones & Verification Gateways
            </h3>
            <p className="text-xs text-zinc-500">Sequential contractual gates requiring verified QA/QC sign-off</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Progress: {completedMilestonesCount}/{totalMilestonesCount} Gates Cleared
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {project.milestones.map((ms, idx) => {
            const isCompleted = ms.status === 'Completed';
            const isInProgress = ms.status === 'In Progress';

            return (
              <div
                key={ms.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                  isCompleted
                    ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 text-zinc-900 dark:text-zinc-200'
                    : isInProgress
                    ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-950 dark:border-white text-zinc-950 dark:text-white shadow-sm'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800/80 text-zinc-400 dark:text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold">Phase {ms.phaseOrder}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : isInProgress ? (
                    <div className="w-2 h-2 rounded-full bg-zinc-950 dark:bg-white animate-ping" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  )}
                </div>

                <div className="font-bold line-clamp-2 leading-tight">{ms.name}</div>

                <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                  <span>${ms.costAllocationUSD.toLocaleString()}</span>
                  <span>{ms.progressPercentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
