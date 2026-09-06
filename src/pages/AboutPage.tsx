import React from 'react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { ShieldCheck, Target, Award, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-250">
      <PublicNavbar />

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            About Structura
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Restoring Trust and Certainty to the Global Built Environment.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Structura was created to eliminate the chronic cost overruns, adversarial disputes, and QA/QC blindspots that plague multi-million dollar capital construction projects.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#091422] border border-slate-200 dark:border-[#182c44] space-y-3">
            <Target className="w-6 h-6 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Our Mission</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Equip construction directors and asset owners with mathematically verifiable data, transparent milestone escrow releases, and automated site forensic intelligence.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#091422] border border-slate-200 dark:border-[#182c44] space-y-3">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Governance First</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We reject the premise of black-box AI automation in safety-critical infrastructure. AI assists and informs; licensed engineers maintain statutory accountability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#091422] border border-slate-200 dark:border-[#182c44] space-y-3">
            <Award className="w-6 h-6 text-blue-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Technical Rigor</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every takeoff calculation, Earned Value index (CPI/SPI), and tolerance matrix is grounded in standard EPC, AAMA, and ASTM engineering standards.
            </p>
          </div>
        </div>

        {/* Governance Charter Block */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0B192C] text-white space-y-4">
          <h3 className="text-lg font-bold text-amber-400">Structura Governance Statement</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Construction failures result from fragmented communications and unverified assertions. Structura establishes an immutable, single source of truth connecting architectural designs, site photographs, daily shift logs, and contractual disbursements.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Tamper-Evident Records</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Professional QA/QC Authority</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Fiduciary Escrow Controls</span>
          </div>
        </div>

        {/* CTA */}
        <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-[#182c44]">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition">
            &larr; Return to Homepage
          </Link>
          <Link
            to="/app"
            className="px-5 py-2.5 rounded-lg bg-[#0B192C] text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-[#122b4a] dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
