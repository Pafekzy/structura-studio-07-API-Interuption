import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Lock, 
  Unlock, 
  FileCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Info
} from 'lucide-react';
import { ConstructionProject, ConstructionMilestone, BOQItem } from '../types';

interface BudgetVarianceEscrowProps {
  project: ConstructionProject;
  onUpdateProject: (updated: ConstructionProject) => void;
  onOpenAdvisorModal: () => void;
}

export const BudgetVarianceEscrow: React.FC<BudgetVarianceEscrowProps> = ({
  project,
  onUpdateProject,
  onOpenAdvisorModal,
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState<ConstructionMilestone>(
    project.milestones.find((m) => m.status === 'In Progress') || project.milestones[0]
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [signingOffId, setSigningOffId] = useState<string | null>(null);

  const categories = ['all', 'Substructure', 'Superstructure', 'Envelope & Facade', 'Roofing', 'MEP & HVAC', 'Interior Finishes', 'Site Works'];

  const filteredBOQ = project.boq.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  const totalBOQBaseline = project.boq.reduce((acc, item) => acc + item.totalCostUSD, 0);
  const totalBOQSpent = project.boq.reduce((acc, item) => acc + item.spentUSD, 0);

  const handleApproveEscrowPayout = (milestoneId: string) => {
    setSigningOffId(milestoneId);
    setTimeout(() => {
      const updatedMilestones = project.milestones.map((ms) => {
        if (ms.id === milestoneId) {
          return {
            ...ms,
            payoutApproved: true,
            escrowStatus: 'Released' as const,
            status: 'Completed' as const,
            progressPercentage: 100,
          };
        }
        return ms;
      });

      const updated = {
        ...project,
        milestones: updatedMilestones,
        actualCostIncurredUSD: project.actualCostIncurredUSD + (selectedMilestone.contractorClaimUSD || 0),
      };

      onUpdateProject(updated);
      setSigningOffId(null);
      setSelectedMilestone(updatedMilestones.find((m) => m.id === milestoneId) || selectedMilestone);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/20">
                Financial Oversight & Escrow Release
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Bill of Quantities (BOQ) & Milestone Escrow Approvals
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live variance tracking across direct trade packages and secure owner milestone sign-off for contractor disbursements.
            </p>
          </div>

          <button
            onClick={onOpenAdvisorModal}
            className="px-4 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition min-h-[40px] w-full sm:w-auto shrink-0"
          >
            <Sparkles className="w-4 h-4 text-zinc-900 dark:text-white" />
            <span>Consult Financial Advisor</span>
          </button>
        </div>
      </div>

      {/* Milestone Escrow Payout Approval Desk */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-5 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Owner Milestone Escrow Payout Gateway</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 uppercase tracking-wider">
                  SANDBOX DEMO
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Simulated multi-sig escrow release for contractor milestone claims. No live banking settlement initiated in sandbox mode.
              </p>
            </div>
          </div>

          {/* Milestone Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Stage:</span>
            <select
              value={selectedMilestone.id}
              onChange={(e) => {
                const found = project.milestones.find((m) => m.id === e.target.value);
                if (found) setSelectedMilestone(found);
              }}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-900 dark:focus:border-white w-full sm:w-auto min-h-[40px]"
            >
              {project.milestones.map((ms) => (
                <option key={ms.id} value={ms.id}>
                  Phase {ms.phaseOrder}: {ms.name} ({ms.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Selected Milestone Detail Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider block">
                  Phase {selectedMilestone.phaseOrder} Milestone
                </span>
                <h4 className="text-base font-bold text-zinc-900 dark:text-white">{selectedMilestone.name}</h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit ${
                  selectedMilestone.escrowStatus === 'Released'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : selectedMilestone.escrowStatus === 'Pending Sign-Off'
                    ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 animate-pulse'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Escrow: {selectedMilestone.escrowStatus}
              </span>
            </div>

            {/* Verification Gateways & Required Certificates */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Mandatory Inspection Gateways & Engineering Certificates</span>
              </h5>
              <div className="space-y-2">
                {selectedMilestone.certificationsRequired.map((cert, idx) => {
                  const isCompleted = selectedMilestone.status === 'Completed' || selectedMilestone.escrowStatus === 'Released';
                  const isPending = selectedMilestone.escrowStatus === 'Pending Sign-Off';

                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs gap-1.5"
                    >
                      <span className="text-zinc-800 dark:text-zinc-200 font-medium">{cert}</span>
                      {isCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Filed & Cleared (Sandbox Demo)</span>
                        </span>
                      ) : isPending ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Pending Auditor Field Sign-Off</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 font-medium flex items-center gap-1 shrink-0">
                          <span>Inspection Hold Point (Pending)</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Financial Breakdown & Action Button (4 cols) */}
          <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                Contractual Payment Summary
              </span>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span>Phase Allocation:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">
                  ${selectedMilestone.costAllocationUSD.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span>Verified Progress:</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{selectedMilestone.progressPercentage}%</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 pt-1">
                <span className="font-bold text-zinc-900 dark:text-white">Claimed Disbursement:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                  ${selectedMilestone.contractorClaimUSD.toLocaleString()}
                </span>
              </div>
            </div>

            {selectedMilestone.payoutApproved ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold text-center flex flex-col items-center justify-center gap-1 min-h-[40px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Sandbox Disbursement Simulated</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-normal">
                  Demo Protocol — No live banking transfer or financial liability initiated.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  onClick={() => handleApproveEscrowPayout(selectedMilestone.id)}
                  disabled={signingOffId === selectedMilestone.id}
                  className="w-full py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50 min-h-[40px]"
                >
                  {signingOffId === selectedMilestone.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Simulating Sandbox Escrow Release...</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Simulate Escrow Release (${selectedMilestone.contractorClaimUSD.toLocaleString()}) [Sandbox Demo]</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-zinc-400 text-center">
                  Sandbox simulation only. Production requires multi-party bank escrow authorization.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Finished 3D Architectural Systems & Material Specifications Cost Allocation Board */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Finished 3D Architectural Systems & Material Specifications Cost Allocation</span>
            </h3>
            <p className="text-xs text-zinc-500">Unit rate breakdown across primary building systems and physical assemblies</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Total Budget: <strong className="text-zinc-900 dark:text-white">${project.totalBaselineBudgetUSD.toLocaleString()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-white">Jura Limestone Facade</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">$380 / m²</span>
            </div>
            <p className="text-[11px] text-zinc-500">30mm Honed Slabs on stainless steel sub-framing. Total: $148,200</p>
            <div className="text-[10px] text-zinc-400 font-mono">Status: On Target (0.0% Var)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-white">Schüco Hi-Finity Glazing</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">$920 / m²</span>
            </div>
            <p className="text-[11px] text-zinc-500">Low-E triple-glazed acoustic units with thermal break. Total: $294,400</p>
            <div className="text-[10px] text-zinc-400 font-mono">Status: Favorable (-2.4% Var)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-white">Calacatta Borghini Joinery</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">$650 / m²</span>
            </div>
            <p className="text-[11px] text-zinc-500">Bespoke Italian book-matched marble slabs. Total: $162,500</p>
            <div className="text-[10px] text-zinc-400 font-mono">Status: On Target (0.0% Var)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-white">Geothermal VRF System</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">$185,000 Lump</span>
            </div>
            <p className="text-[11px] text-zinc-500">Ground-source heat pump loop + MERV 16 filtration. Total: $185,000</p>
            <div className="text-[10px] text-zinc-400 font-mono">Status: Favorable (-1.6% Var)</div>
          </div>
        </div>
      </div>

      {/* Bill of Quantities (BOQ) Ledger & Variance Table */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-zinc-900 dark:text-white" />
              <span>Bill of Quantities (BOQ) Live Variance Ledger</span>
            </h3>
            <p className="text-xs text-zinc-500">Baseline contract quantities vs actual incurred trade expenditures.</p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition shrink-0 min-h-[36px] ${
                  activeCategory === cat
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {cat === 'all' ? 'All Packages' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto no-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-3 px-4 font-semibold">Trade Item / Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Rate</th>
                <th className="py-3 px-4 font-semibold text-right">Baseline Budget</th>
                <th className="py-3 px-4 font-semibold text-right">Incurred Spend</th>
                <th className="py-3 px-4 font-semibold text-right">Variance</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {filteredBOQ.map((item) => {
                const isOver = item.variancePercentage > 0;
                const isUnder = item.variancePercentage < 0;
                return (
                  <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-white max-w-xs">{item.description}</td>
                    <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">{item.category}</td>
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">${item.unitRateUSD.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-white whitespace-nowrap">
                      ${item.totalCostUSD.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-200 whitespace-nowrap">
                      ${item.spentUSD.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                      {item.variancePercentage === 0 ? (
                        <span className="text-zinc-400">0.0%</span>
                      ) : isOver ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">+{item.variancePercentage}%</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.variancePercentage}%</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.status === 'Favorable'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : item.status === 'On Target'
                            ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                            : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
