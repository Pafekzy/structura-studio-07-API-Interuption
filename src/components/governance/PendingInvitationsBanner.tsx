import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  MapPin, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { ProjectAppointment } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface PendingInvitationsBannerProps {
  onAppointmentAccepted?: () => void;
}

export const PendingInvitationsBanner: React.FC<PendingInvitationsBannerProps> = ({
  onAppointmentAccepted,
}) => {
  const { idToken, user } = useAuth();
  const [invitations, setInvitations] = useState<ProjectAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!idToken) return;
    try {
      const res = await fetch('/api/invitations', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      // Graceful silence on banner poll
    }
  }, [idToken]);

  useEffect(() => {
    fetchInvitations();
    // Poll every 30 seconds for newly received invitations
    const interval = setInterval(fetchInvitations, 30000);
    return () => clearInterval(interval);
  }, [fetchInvitations]);

  const handleRespond = async (invitationId: string, accept: boolean) => {
    setProcessingId(invitationId);
    setActionError(null);
    setActionSuccess(null);

    const endpoint = accept 
      ? `/api/invitations/${invitationId}/accept`
      : `/api/invitations/${invitationId}/decline`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${accept ? 'accept' : 'decline'} invitation.`);
      }

      setActionSuccess(accept ? 'Appointment accepted! Project authority is now active.' : 'Invitation declined.');
      fetchInvitations();
      if (accept) {
        onAppointmentAccepted?.();
      }
    } catch (err: any) {
      setActionError(err.message || 'Operation failed.');
    } finally {
      setProcessingId(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {actionError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <AnimatePresence>
        {invitations.map((inv) => (
          <motion.div
            key={inv.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-sky-500/10 to-transparent border-2 border-amber-500/40 shadow-lg text-slate-900 dark:text-white"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                    <Clock className="w-3 h-3" />
                    ACTION REQUIRED
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Project Governance Appointment Offer
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Serve as <strong>{inv.role.replace(/_/g, ' ')}</strong> on Project
                </h4>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    Project ID: {inv.projectId}
                  </span>
                  <span className="text-slate-400">
                    Invited: {new Date(inv.invitedAt).toLocaleDateString()}
                  </span>
                </div>

                {inv.reason && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-slate-200 dark:border-[#162a42]">
                    &ldquo;{inv.reason}&rdquo;
                  </p>
                )}

                <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  <strong>Governance Policy:</strong> Accepting this appointment establishes your active fiduciary responsibility on this project. Authority is not active until accepted.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                <button
                  onClick={() => handleRespond(inv.id, false)}
                  disabled={processingId === inv.id}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#14263a] border border-slate-300 dark:border-[#1e3e62] transition disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 text-slate-400" />
                  <span>Decline</span>
                </button>

                <button
                  onClick={() => handleRespond(inv.id, true)}
                  disabled={processingId === inv.id}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{processingId === inv.id ? 'Accepting...' : 'Accept Appointment'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
