import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { 
  Calculator, 
  Camera, 
  TrendingUp, 
  Lock, 
  RotateCw, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  FileSpreadsheet,
  Activity
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const capabilities = [
    {
      icon: <Calculator className="w-6 h-6 text-emerald-500" />,
      title: 'Parametric BOQ Estimator & Quantity Takeoff',
      badge: 'Core Engine',
      description: 'Generates detailed Bills of Quantities (BOQ) segmented into substructure, superstructure, envelope, MEP, and finishes based on plot area, gross floor area, building style, and structural material selections.',
      deliverables: [
        'Detailed trade cost allocation breakdown',
        'Baseline project duration and Gantt scheduling',
        'Direct connection to canonical estimation API',
        'Subject to Quantity Surveyor professional sign-off'
      ]
    },
    {
      icon: <Camera className="w-6 h-6 text-blue-500" />,
      title: 'Photographic AI Forensic Site Inspection',
      badge: 'Multimodal Vision',
      description: 'Inspects on-site progress photos against engineering drawings. Identifies rebar embedment, formwork alignment, and micro-defects with full traceability and safety observations.',
      deliverables: [
        'Automated element and material detection',
        'Severity-classified defect non-conformance logs',
        'OSHA safety & site housekeeping compliance',
        'Truthful failure fallbacks (no fabricated approvals)'
      ]
    },
    {
      icon: <RotateCw className="w-6 h-6 text-purple-500" />,
      title: 'Turnkey 360° BIM & Architectural Visualizer',
      badge: 'Digital Twin',
      description: 'Provides 3D spatial orbit visualization of structural framing and 360° panoramic interactive interior walk-throughs to verify physical progress against proposed finished state.',
      deliverables: [
        'Interactive Three.js 3D building model',
        '360° spherical panoramic interior navigation',
        'Tolerance comparison matrix against physical site',
        'Material specification cross-reference board'
      ]
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
      title: 'Dynamic Situation Reports (SITREP) & EVM',
      badge: 'Executive Intelligence',
      description: 'Synthesizes daily shift logs and trade expenditures into executive Situation Reports featuring Earned Value Management indices (CPI/SPI) and critical-path schedule buffers.',
      deliverables: [
        'Automated daily/weekly/monthly SITREP compilation',
        'Cost Performance Index (CPI) and Schedule Performance Index (SPI)',
        'Trade budget variance alerts and mitigation logging',
        'Owner decision action item checklists'
      ]
    },
    {
      icon: <Lock className="w-6 h-6 text-emerald-500" />,
      title: 'Milestone Escrow & Progress Claims Gateway',
      badge: 'Financial Governance',
      description: 'Secures contractor disbursements behind verified milestone sign-offs. Eliminates premature payment risks and protects project capital reserves.',
      deliverables: [
        'Dual-signatory milestone completion verification',
        'Contractor claim review and variance audit',
        'Clear sandbox demo simulation indicator',
        'Dispute avoidance through documented evidence'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-250">
      <PublicNavbar />

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Platform Capabilities
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Integrated Modules Engineered for High-Stakes Construction.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every module in Structura operates on unified data models, ensuring that changes on site immediately reflect across cost baselines, SITREPs, and milestone escrow gates.
          </p>
        </div>

        {/* Modules List */}
        <div className="space-y-6">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#091422] border border-slate-200 dark:border-[#182c44] shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#14263b] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#12243a] border border-slate-200 dark:border-[#1e3e62] flex items-center justify-center shrink-0">
                    {cap.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {cap.title}
                    </h3>
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider">
                      {cap.badge}
                    </span>
                  </div>
                </div>

                <Link
                  to="/app"
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#112438] hover:bg-slate-200 dark:hover:bg-[#18334e] text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition self-start sm:self-center"
                >
                  <span>Open in Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {cap.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {cap.deliverables.map((item, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-2xl bg-[#0B192C] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Experience All Capabilities Live</h3>
            <p className="text-xs text-slate-300">Launch the interactive sandbox environment with sample luxury villa projects.</p>
          </div>
          <Link
            to="/app"
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition shrink-0 shadow-lg"
          >
            <span>Launch Live Platform</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
