import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Building, 
  Award, 
  X, 
  Send,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { ProjectRole } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ProfessionalCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  primaryRole: string;
  verificationDisplay: string;
  professionalVerificationStatus: string;
  identityStatus: string;
  roleDetails?: {
    companyName?: string;
    primaryDiscipline?: string;
    yearsExperience?: number;
    professionalBody?: string;
    registrationNumber?: string;
    country?: string;
  };
}

interface InviteProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  role: ProjectRole;
  roleTitle: string;
  onInvitationSent: () => void;
}

export const InviteProfessionalModal: React.FC<InviteProfessionalModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  role,
  roleTitle,
  onInvitationSent,
}) => {
  const { idToken } = useAuth();
  const [candidates, setCandidates] = useState<ProfessionalCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<ProfessionalCandidate | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({ role });
        if (search.trim()) queryParams.append('search', search.trim());
        
        const res = await fetch(`/api/professionals?${queryParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'Failed to search professional directory.');
        }
      } catch (err: any) {
        setError('Network error while searching directory.');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [isOpen, role, search, idToken]);

  const handleSendInvitation = async () => {
    if (!selectedCandidate) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          professionalUserId: selectedCandidate.id,
          role,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue appointment invitation.');
      }

      setSuccess(`Invitation issued to ${selectedCandidate.firstName} ${selectedCandidate.lastName}. Status is INVITED.`);
      setTimeout(() => {
        onInvitationSent();
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Failed to issue appointment invitation.');
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
          className="w-full max-w-2xl bg-white dark:bg-[#081320] border border-slate-200 dark:border-[#1a3350] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#162a42] flex items-center justify-between bg-slate-50/50 dark:bg-[#0a1828]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Appoint {roleTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Project: <strong className="text-slate-700 dark:text-slate-200">{projectName}</strong>
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

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

            {/* Governance Policy Notice */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
              <strong>Accountability Rule:</strong> Candidates must hold a registered account with primary role matching <code>{role}</code>. Issuing an invitation creates a pending governance appointment with status <strong>INVITED</strong>. Authority is not granted until the professional explicitly accepts.
            </div>

            {/* Directory Search Field */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search registered ${roleTitle} candidates by name, company, or discipline...`}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Candidate Directory List */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Available Professionals ({candidates.length})</span>
                <span className="text-[10px] font-normal text-slate-400">Strict Role Matching Enforced</span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Searching qualified professional directory...
                </div>
              ) : candidates.length === 0 ? (
                <div className="py-8 text-center rounded-xl bg-slate-50 dark:bg-[#0c1c2e] border border-dashed border-slate-200 dark:border-[#1a3350] text-xs text-slate-400 space-y-1">
                  <p>No registered candidates found matching role <strong>{roleTitle}</strong>.</p>
                  <p className="text-[11px] text-slate-500">Other practitioners can register an account specifying this role to appear in this directory.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {candidates.map((cand) => {
                    const isSelected = selectedCandidate?.id === cand.id;
                    return (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidate(cand)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-slate-900 dark:text-white shadow-sm'
                            : 'bg-slate-50/70 dark:bg-[#0c1c2e]/70 hover:bg-slate-100 dark:hover:bg-[#10243b] border-slate-200 dark:border-[#172e48]'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {cand.firstName} {cand.lastName}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#162e4a] text-slate-700 dark:text-slate-300 font-medium">
                              {cand.email}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            {cand.roleDetails?.companyName && (
                              <span className="flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {cand.roleDetails.companyName}
                              </span>
                            )}
                            {cand.roleDetails?.yearsExperience !== undefined && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {cand.roleDetails.yearsExperience} yrs exp
                              </span>
                            )}
                            {cand.roleDetails?.country && (
                              <span>{cand.roleDetails.country}</span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            cand.professionalVerificationStatus === 'VERIFIED'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-500/10 border-slate-500/30 text-slate-600 dark:text-slate-400'
                          }`}>
                            {cand.verificationDisplay}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-amber-500">Selected</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reason / Engagement Notes */}
            {selectedCandidate && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#182c44]">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Appointment Scope & Engagement Notes (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Appointed as Structural QA/QC Lead for substructure and superstructure inspection phases."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0c1c2e] border border-slate-200 dark:border-[#1a3350] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-[#162a42] bg-slate-50/50 dark:bg-[#0a1828] flex items-center justify-between">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#14263a] transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSendInvitation}
              disabled={!selectedCandidate || submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-amber-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Issuing Appointment...' : 'Issue Governance Invitation'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
