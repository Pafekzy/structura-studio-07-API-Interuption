import React from 'react';
import { ShieldAlert, ArrowLeft, Users, Lock, ChevronRight } from 'lucide-react';
import { NavigationTab, UserRole } from '../types';

interface AccessRestrictedViewProps {
  currentRole: UserRole;
  requestedTab: NavigationTab;
  onNavigateToAuthorized: () => void;
  onReturnToGateway: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  currentRole,
  requestedTab,
  onNavigateToAuthorized,
  onReturnToGateway,
}) => {
  const getTabName = (tab: NavigationTab): string => {
    switch (tab) {
      case 'cockpit': return 'Executive Cockpit';
      case 'monitoring': return 'Periodic Logs & SITREPs';
      case 'inspection': return 'AI Visual Site Audits';
      case 'budget': return 'BOQ & Escrow Release Gateway';
      case 'finished_render': return '360° Turnkey 3D Model';
      case 'new_estimator': return 'Project Estimator Wizard';
      case 'stakeholder_owner': return 'Owner & Investor Portal';
      case 'stakeholder_director': return 'Senior Project Director Hub';
      case 'stakeholder_contractor': return 'Prime General Contractor Station';
      case 'stakeholder_qaqc': return 'Structural QA/QC Auditor Portal';
      default: return 'Requested Section';
    }
  };

  const getAuthorizedRolesForTab = (tab: NavigationTab): string[] => {
    switch (tab) {
      case 'stakeholder_owner': return ['Owner / Client'];
      case 'stakeholder_director': return ['Senior Project Director'];
      case 'stakeholder_contractor': return ['General Contractor'];
      case 'stakeholder_qaqc': return ['Structural QA/QC Auditor'];
      case 'cockpit': return ['Senior Project Director'];
      case 'new_estimator': return ['Senior Project Director'];
      case 'inspection': return ['Senior Project Director', 'General Contractor', 'Structural QA/QC Auditor'];
      default: return ['Authorized Personnel'];
    }
  };

  const authorizedRoles = getAuthorizedRolesForTab(requestedTab);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="max-w-xl w-full bg-white dark:bg-zinc-950 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider border border-red-500/20 inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>Role-Based Access Control (RBAC) Guard</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Restricted Section: {getTabName(requestedTab)}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            You are currently authenticated as <strong className="text-zinc-900 dark:text-white">{currentRole}</strong>. 
            This module is reserved for: <span className="font-semibold text-amber-600 dark:text-amber-400">{authorizedRoles.join(', ')}</span>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-left text-xs space-y-2">
          <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">Security Policy Context:</div>
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
            In Structura OS, each stakeholder dashboard enforces distinct governance boundaries to prevent conflicts of interest (e.g. Contractors cannot release their own escrow disbursements, and Owners cannot edit raw engineering rebar schedules).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onNavigateToAuthorized}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to My {currentRole} Dashboard</span>
          </button>

          <button
            onClick={onReturnToGateway}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Switch Role / Portal Gateway</span>
          </button>
        </div>
      </div>
    </div>
  );
};
