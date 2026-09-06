import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  FolderPlus, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Globe, 
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Organization, ConstructionProject, OrganizationType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface OrganizationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (newProject: ConstructionProject) => void;
}

export const OrganizationManagementModal: React.FC<OrganizationManagementModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { idToken, userProfile } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // View state: 'list' | 'create_org' | 'create_project'
  const [viewState, setViewState] = useState<'list' | 'create_org' | 'create_project'>('list');

  // Form states for Create Organization
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('REAL_ESTATE_DEVELOPER');
  const [jurisdiction, setJurisdiction] = useState('');
  const [country, setCountry] = useState('United States');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');

  // Form states for Create Project
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectType, setProjectType] = useState<'COMMERCIAL' | 'RESIDENTIAL' | 'INFRASTRUCTURE' | 'INDUSTRIAL' | 'CIVIC'>('COMMERCIAL');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(15000000);
  const [currency, setCurrency] = useState('USD');
  const [plannedStartDate, setPlannedStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedHandoverDate, setPlannedHandoverDate] = useState('2027-12-31');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    if (!idToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
        if (data.length > 0 && !activeOrg) {
          setActiveOrg(data[0]);
        }
      }
    } catch {
      setError('Could not connect to organization service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
      setViewState('list');
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, idToken]);

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: orgName,
          type: orgType,
          jurisdiction,
          country,
          registrationNumber: registrationNumber || undefined,
          address: registeredAddress || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create organization.');
      }

      setSuccess('Organization created successfully. Verification initialized to NOT_STARTED.');
      await fetchOrganizations();
      setActiveOrg(data.organization);
      setTimeout(() => {
        setSuccess(null);
        setViewState('list');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${activeOrg.id}/projects`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          location: projectLocation,
          projectType,
          description: description || undefined,
          totalBaselineBudgetUSD: Number(budget),
          currency,
          startDate: plannedStartDate,
          targetHandoverDate: plannedHandoverDate,
          currentStage: 'Planning & Feasibility',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project under organization.');
      }

      setSuccess('Project established under organization governance. Governance team slots initialized.');
      onProjectCreated?.(data.project);
      setTimeout(() => {
        setSuccess(null);
        setViewState('list');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-3xl bg-white dark:bg-[#08121e] border border-slate-200 dark:border-[#162a42] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#162a42] flex items-center justify-between bg-slate-50/50 dark:bg-[#0a1828]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Organization Governance & Project Portfolio
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage legal entity governance and project creations under fiduciary authority.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#14263a] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation / Action Bar */}
          <div className="px-6 py-3 border-b border-slate-200 dark:border-[#162a42] bg-slate-100/50 dark:bg-[#0b1726] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setViewState('list'); setError(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewState === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#14263a]'
                }`}
              >
                Organizations ({organizations.length})
              </button>
              <button
                onClick={() => { setViewState('create_org'); setError(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewState === 'create_org'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#14263a]'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Organization</span>
              </button>
            </div>

            {activeOrg && viewState === 'list' && (
              <button
                onClick={() => { setViewState('create_project'); setError(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-bold hover:bg-sky-400 transition shadow-sm"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Project under {activeOrg.name}</span>
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* VIEW 1: ORGANIZATIONS LIST */}
            {viewState === 'list' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Loading your governed organizations...
                  </div>
                ) : organizations.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-[#0a1726] border border-dashed border-slate-200 dark:border-[#162a42] space-y-3">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No governed organizations registered yet.</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Create an organization (e.g. Developer, Asset Owner, Joint Venture) to house construction projects and appoint governance teams.
                      </p>
                    </div>
                    <button
                      onClick={() => setViewState('create_org')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register First Organization</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {organizations.map((org) => {
                      const isSelected = activeOrg?.id === org.id;
                      return (
                        <div
                          key={org.id}
                          onClick={() => setActiveOrg(org)}
                          className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white shadow-sm'
                              : 'bg-slate-50/70 dark:bg-[#0c1c2e]/70 hover:bg-slate-100 dark:hover:bg-[#10243b] border-slate-200 dark:border-[#172e48]'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#162e4a] text-slate-700 dark:text-slate-300 uppercase">
                                {org.type.replace(/_/g, ' ')}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-amber-500">Selected</span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {org.name}
                            </h4>

                            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                              <p className="truncate">Jurisdiction: {org.jurisdiction}, {org.country}</p>
                              {org.registrationNumber && (
                                <p className="font-mono text-[11px]">Reg: {org.registrationNumber}</p>
                              )}
                            </div>

                            {/* Truthful Governance Badges */}
                            <div className="pt-2 border-t border-slate-200 dark:border-[#162a42] space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400">Org Verification:</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  NOT STARTED
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400">Authority Level:</span>
                                <span className="font-bold text-slate-500 dark:text-slate-400">
                                  PRIMARY OWNER (NOT YET VERIFIED)
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: CREATE ORGANIZATION FORM */}
            {viewState === 'create_org' && (
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs">
                  <strong>Organization Governance:</strong> Registering an organization sets up a legal governance entity. The creating user is recorded as the <strong>OWNER</strong>. Verification status is initialized to <strong>NOT_STARTED</strong>.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Organization Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Apex Sovereign Capital & Development LLC"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Organization Type *
                    </label>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="REAL_ESTATE_DEVELOPER">Real Estate Developer</option>
                      <option value="INDIVIDUAL_DEVELOPER">Individual Developer / Private Client</option>
                      <option value="CORPORATE">Corporate Enterprise</option>
                      <option value="INSTITUTIONAL">Institutional / Sovereign Fund</option>
                      <option value="PUBLIC_SECTOR">Public Sector / Municipal</option>
                      <option value="OTHER">Other Enterprise Structure</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      State / Jurisdiction *
                    </label>
                    <input
                      type="text"
                      required
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      placeholder="e.g. California / Delaware / England & Wales"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Country *
                    </label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. United States / United Kingdom"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Corporate Registration Number
                    </label>
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      placeholder="e.g. DE-8392014"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Registered Corporate Address
                    </label>
                    <input
                      type="text"
                      value={registeredAddress}
                      onChange={(e) => setRegisteredAddress(e.target.value)}
                      placeholder="e.g. 500 Howard Street, Suite 1400, San Francisco, CA 94105"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#162a42] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setViewState('list')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14263a] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition shadow-sm"
                  >
                    {submitting ? 'Creating Organization...' : 'Create Governance Organization'}
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 3: CREATE PROJECT UNDER ORGANIZATION */}
            {viewState === 'create_project' && activeOrg && (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 text-xs">
                  <strong>Project Organization:</strong> This project will be established under <strong>{activeOrg.name}</strong>. You will be assigned as <strong>OWNER_CLIENT</strong>, and vacancies will be created for the remaining three governance roles.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Pacific Horizon Tower — Phase I"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Location / Jurisdiction *
                    </label>
                    <input
                      type="text"
                      required
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                      placeholder="e.g. San Francisco, California"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Project Typology *
                    </label>
                    <select
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="COMMERCIAL">Commercial High-Rise</option>
                      <option value="RESIDENTIAL">Multi-Family Residential</option>
                      <option value="INFRASTRUCTURE">Civil Infrastructure</option>
                      <option value="INDUSTRIAL">Advanced Industrial</option>
                      <option value="CIVIC">Civic & Institutional</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Baseline Budget ({currency}) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100000}
                      step={50000}
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Handover Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={plannedHandoverDate}
                      onChange={(e) => setPlannedHandoverDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Project Governance Scope / Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the development, engineering scope, and governance requirements."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#162a42] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setViewState('list')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#14263a] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs hover:bg-sky-400 transition shadow-sm"
                  >
                    {submitting ? 'Creating Project...' : 'Create Governed Project'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-[#162a42] bg-slate-50/50 dark:bg-[#0a1828] flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Structura Governance Architecture</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#12243a] text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-[#18314e] transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
