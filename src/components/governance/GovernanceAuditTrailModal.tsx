import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  ShieldCheck, 
  Clock, 
  User, 
  FileText, 
  X, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AuditEvent } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface GovernanceAuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectName?: string;
}

export const GovernanceAuditTrailModal: React.FC<GovernanceAuditTrailModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const { idToken } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditEvents = async () => {
    if (!projectId || !idToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit-events?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else {
        setError('Failed to load audit events');
      }
    } catch {
      setError('Could not connect to audit event service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuditEvents();
    }
  }, [isOpen, projectId, idToken]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="w-full max-w-2xl bg-white dark:bg-[#08121e] border border-slate-200 dark:border-[#162a42] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-[#162a42] flex items-center justify-between bg-slate-50/50 dark:bg-[#0a1828]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Governance Audit Trail
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Traceable fiduciary event ledger for project: <strong className="text-slate-700 dark:text-slate-200">{projectName || projectId}</strong>
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

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading audit trail entries...
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-slate-50 dark:bg-[#0c1c2e] border border-dashed border-slate-200 dark:border-[#1a3350] text-xs text-slate-400 space-y-1">
                <p>No audit entries recorded for this project yet.</p>
                <p className="text-[11px] text-slate-500">Actions like invitations, appointments, and project creation will be logged here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#0c1c2e]/70 border border-slate-200 dark:border-[#172e48] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white font-mono text-[11px]">
                        {evt.action}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-300">
                      Actor: <span className="font-mono text-slate-800 dark:text-slate-200">{evt.actorUserId}</span>
                    </div>

                    {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                      <pre className="p-2 rounded-lg bg-black/5 dark:bg-black/30 text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto">
                        {JSON.stringify(evt.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-[#162a42] bg-slate-50/50 dark:bg-[#0a1828] flex justify-between items-center text-xs text-slate-400">
            <span>Cryptographic audit chains deferred to subsequent sprint</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-[#14263a] text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-[#1a3350] transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
