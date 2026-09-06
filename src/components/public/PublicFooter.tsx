import React from 'react';
import { Link } from 'react-router-dom';
import { StructuraLogo } from '../StructuraLogo';
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-[#070e17] text-slate-300 border-t border-[#182c44] transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-[#182c44]">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <StructuraLogo size="md" showText={true} showSubtitle={true} variant="dark" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise construction lifecycle platform delivering parametric cost modeling, photographic AI site audits, Situation Reports (SITREPs), and multi-party milestone escrow governance.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Engineered for Construction Governance</span>
            </div>
          </div>

          {/* Solutions / Personas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Stakeholder Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/app" className="hover:text-amber-400 transition">
                  Owner / Client Command Desk
                </Link>
              </li>
              <li>
                <Link to="/app" className="hover:text-amber-400 transition">
                  Senior Project Director Cockpit
                </Link>
              </li>
              <li>
                <Link to="/app" className="hover:text-amber-400 transition">
                  General Contractor Site Station
                </Link>
              </li>
              <li>
                <Link to="/app" className="hover:text-amber-400 transition">
                  Structural QA/QC Auditor Station
                </Link>
              </li>
            </ul>
          </div>

          {/* Capabilities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Capabilities
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/services" className="hover:text-amber-400 transition">
                  Parametric BOQ Estimator
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-amber-400 transition">
                  Multimodal AI Defect Audits
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-amber-400 transition">
                  Turnkey 360° BIM Visualizer
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-amber-400 transition">
                  Milestone Escrow Gateway
                </Link>
              </li>
            </ul>
          </div>

          {/* Enterprise Access */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Platform Access
            </h4>
            <p className="text-xs text-slate-400">
              Experience the live interactive sandbox workspace with real parametric calculation and AI vision analysis.
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition"
            >
              <span>Launch Structura OS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom copyright and governance notice */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Structura Technologies Inc. All rights reserved. Professional construction liability rests with licensed human engineers.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-slate-400 transition">About</Link>
            <Link to="/services" className="hover:text-slate-400 transition">Platform</Link>
            <Link to="/contact" className="hover:text-slate-400 transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
