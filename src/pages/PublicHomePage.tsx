import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Calculator, 
  Camera, 
  TrendingUp, 
  Lock, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  HardHat,
  Users,
  Compass,
  Eye,
  FileText
} from 'lucide-react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { StructuraLogo } from '../components/StructuraLogo';
import { ProjectLifecycleCarousel } from '../components/public/ProjectLifecycleCarousel';

export const PublicHomePage: React.FC = () => {
  const personas = [
    {
      title: 'Owner / Client',
      roleTag: 'Fiduciary Authority',
      desc: 'Real-time visibility into baseline budgets, cost variances, 360° architectural finished building models, and milestone escrow release authorization.',
      features: ['Real-time BOQ variance tracking', 'Milestone escrow payout approval', '360° Turnkey architectural BIM viewer'],
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
      actionTab: 'stakeholder_owner'
    },
    {
      title: 'Senior Project Director',
      roleTag: 'Executive Cockpit',
      desc: 'Comprehensive multi-package oversight, Earned Value EVM metrics (CPI/SPI), critical-path schedule buffers, and automated SITREP synthesis.',
      features: ['Automated situation reports (SITREP)', 'EVM performance analysis', 'Parametric BOQ estimator engine'],
      badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30',
      actionTab: 'stakeholder_director'
    },
    {
      title: 'General Contractor',
      roleTag: 'Site Operations',
      desc: 'Streamlined daily shift logs, subcontractor coordination, material staging tracking, and milestone payment claim submissions.',
      features: ['Daily labor & trade shift logging', 'Milestone completion claims', 'Material delivery reconciliation'],
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
      actionTab: 'stakeholder_contractor'
    },
    {
      title: 'Structural QA/QC Auditor',
      roleTag: 'Engineering Assurance',
      desc: 'Multimodal AI vision defect scanning, AAMA water penetration verification, laser plumbness validation, and non-conformance reports.',
      features: ['Photographic defect analysis', 'Structural tolerance verification', 'Independent statutory sign-off'],
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      actionTab: 'stakeholder_qaqc'
    }
  ];

  const corePillars = [
    {
      icon: <Calculator className="w-5 h-5 text-emerald-500" />,
      title: 'Parametric BOQ Estimator',
      desc: 'Generates trade-by-trade takeoff schedules, structural cores, and budget baselines grounded in architectural specifications.',
    },
    {
      icon: <Camera className="w-5 h-5 text-blue-500" />,
      title: 'Multimodal AI Site Inspection',
      desc: 'Scans high-resolution on-site photographs against engineering specifications to flag micro-cracks, rebar displacement, and OSHA violations.',
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-amber-500" />,
      title: 'Automated SITREP Synthesis',
      desc: 'Condenses complex multi-trade shift logs into executive Situation Reports with Earned Value Management (EVM) metrics.',
    },
    {
      icon: <Lock className="w-5 h-5 text-purple-500" />,
      title: 'Milestone Escrow Governance',
      desc: 'Ties contractor disbursements to verified engineering QA/QC sign-off, protecting owner capital and preventing dispute delays.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-250">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-200 dark:border-[#182c44]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Construction Intelligence & Oversight OS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
              Architectural Precision. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 dark:from-amber-400 dark:to-amber-500">
                Fiduciary Protection.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Structura unites Owners, Project Directors, General Contractors, and Structural QA/QC Auditors on a single operating system. From parametric BOQ estimation to photographic AI defect auditing and milestone escrow release.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/app"
                className="px-6 py-3.5 rounded-xl bg-[#0B192C] text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-[#122b4a] dark:hover:bg-amber-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition shadow-lg"
              >
                <span>Launch Live OS Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/services"
                className="px-6 py-3.5 rounded-xl bg-white dark:bg-[#0c1a2c] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#12263f] border border-slate-200 dark:border-[#1e3e62] font-semibold text-sm transition"
              >
                Explore Capabilities
              </Link>
            </div>

            {/* Quick Status Bar */}
            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Parametric BOQ Engine</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Multimodal Vision AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Milestone Escrow Safeguard</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Pillars */}
      <section className="py-16 sm:py-24 bg-white dark:bg-[#070e17] border-b border-slate-200 dark:border-[#182c44]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-2">
              Engineering Subsystems
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              End-to-end lifecycle intelligence from groundbreak to handover.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {corePillars.map((pillar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0c1827] border border-slate-200 dark:border-[#182c44] hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#12243a] border border-slate-200 dark:border-[#1e3e62] flex items-center justify-center">
                    {pillar.icon}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Completed-Project Architectural Showcase & Construction Lifecycle Carousel */}
      <ProjectLifecycleCarousel />

      {/* 4 Stakeholder Portals Showcase */}
      <section className="py-16 sm:py-24 bg-[#f8fafc] dark:bg-[#060d16] border-b border-slate-200 dark:border-[#182c44]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-2">
              Multi-Party Governance
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dedicated operational stations for every major project stakeholder.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Each stakeholder accesses customized intelligence with role-based clearances and audit trails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {personas.map((persona, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#091422] border border-slate-200 dark:border-[#182c44] shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${persona.badgeColor}`}>
                      {persona.roleTag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {persona.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                      {persona.desc}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#14263b]">
                    {persona.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to="/app"
                    className="w-full py-2.5 rounded-lg bg-slate-100 dark:bg-[#112438] hover:bg-slate-200 dark:hover:bg-[#18334e] text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Enter {persona.title} Station</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering Governance Charter */}
      <section className="py-16 sm:py-20 bg-white dark:bg-[#070e17] border-b border-slate-200 dark:border-[#182c44]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-[#0B192C] text-white border border-[#1b3452] space-y-6 relative overflow-hidden">
            <div className="max-w-2xl space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Structura Engineering Governance Charter</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Artificial Intelligence assists; licensed human engineers remain accountable.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Structura adheres strictly to structural engineering governance. AI vision models detect non-conformances and calculate preliminary takeoffs, but legal sign-offs, statutory building code compliance, and bank financial settlements require professional human authentication.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No Fabricated Approvals</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dual-Signatory Escrow</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tamper-Evident Audit Trails</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-[#f8fafc] dark:bg-[#060d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to inspect the live Structura OS workspace?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Experience real-time parametric estimation, 3D building visualization, and AI forensic auditing in our interactive sandbox environment.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/app"
              className="px-8 py-4 rounded-xl bg-[#0B192C] text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-[#122b4a] dark:hover:bg-amber-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition shadow-xl"
            >
              <span>Launch Live Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};
