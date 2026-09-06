import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Building, 
  FileText, 
  X, 
  Award,
  AlertCircle
} from 'lucide-react';
import { useAuth, ROLE_DISPLAY_NAMES } from '../../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, userRole, authProviderType } = useAuth();

  if (!isOpen || !userProfile) return null;

  const isOwner = userProfile.primaryRole === 'OWNER_CLIENT';

  const getStatusBadge = (status: string, label: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            {label}
          </span>
        );
      case 'NOT_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
            <CheckCircle2 className="w-3 h-3" />
            {label}
          </span>
        );
      case 'NOT_STARTED':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
            <AlertCircle className="w-3 h-3" />
            {label}
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full max-w-xl bg-white dark:bg-[#08121e] border border-slate-200 dark:border-[#1a3350] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-[#182c44] flex items-center justify-between bg-slate-50/50 dark:bg-[#0b1828]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {userProfile.firstName} {userProfile.lastName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  ID: {userProfile.id}
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

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Primary Stakeholder Role Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Primary Stakeholder Role
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {ROLE_DISPLAY_NAMES[userProfile.primaryRole]}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Account authority is strictly bounded to this declared role.
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold font-mono">
                  {userProfile.primaryRole}
                </span>
              </div>
            </div>

            {/* Verification Governance Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Governance & Verification Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Account Status */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Status</span>
                  {getStatusBadge(userProfile.accountStatus, userProfile.accountStatus)}
                </div>

                {/* Identity Verification */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Identity Verification</span>
                  {getStatusBadge(userProfile.identityStatus, userProfile.identityStatus === 'NOT_STARTED' ? 'Not Started' : userProfile.identityStatus)}
                </div>

                {/* Professional / Owner Verification */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isOwner ? 'Owner Authority' : 'Professional Sign-Off'}
                  </span>
                  {isOwner ? (
                    getStatusBadge('NOT_REQUIRED', 'Not Required')
                  ) : (
                    getStatusBadge(userProfile.professionalVerificationStatus, 'Not Started')
                  )}
                </div>

              </div>

              {/* Truthful Verification Disclaimer */}
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <div className="space-y-0.5 text-[11px] leading-relaxed">
                  <strong>Verification Audit Notice:</strong> Role declaration in Structura establishes account identity. Professional engineering verification & statutory sign-off credentials undergo independent third-party board validation prior to field clearance (Sprint 03).
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                Account Credentials & Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-[#091524] border border-slate-200 dark:border-[#182c44] flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">Email Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {userProfile.email}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-[#091524] border border-slate-200 dark:border-[#182c44] flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block">Phone Number</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {userProfile.phone || 'Not Provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Declared Role Profile Information */}
            {userProfile.roleDetails && Object.keys(userProfile.roleDetails).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Declared Profile Information
                </h4>
                <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-[#091524] border border-slate-200 dark:border-[#182c44] text-xs space-y-2">
                  {userProfile.roleDetails.intendedUse && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#14263a]">
                      <span className="text-slate-400">Intended Project Use:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.roleDetails.intendedUse}</span>
                    </div>
                  )}
                  {userProfile.roleDetails.primaryDiscipline && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#14263a]">
                      <span className="text-slate-400">Primary Discipline:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.roleDetails.primaryDiscipline}</span>
                    </div>
                  )}
                  {userProfile.roleDetails.yearsExperience && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#14263a]">
                      <span className="text-slate-400">Industry Experience:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.roleDetails.yearsExperience} Years</span>
                    </div>
                  )}
                  {userProfile.roleDetails.companyName && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#14263a]">
                      <span className="text-slate-400">Organization / Company:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.roleDetails.companyName}</span>
                    </div>
                  )}
                  {userProfile.roleDetails.professionalBody && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#14263a]">
                      <span className="text-slate-400">Professional Body:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.roleDetails.professionalBody}</span>
                    </div>
                  )}
                  {userProfile.roleDetails.registrationNumber && (
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-[#14263a]">
                      <span className="text-slate-400">Registration Number:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{userProfile.roleDetails.registrationNumber}</span>
                    </div>
                  )}
                  {userProfile.roleDetails.country && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Jurisdiction / Country:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{userProfile.roleDetails.country}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authentication Engine Status */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#182c44]">
              {authProviderType === 'server_sandbox' && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed">
                  <strong>DEVELOPER SANDBOX:</strong> This account is running in developer preview mode with server persistence. Identity verification and credentials have not been cryptographically verified by external authorities.
                </div>
              )}
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Auth Provider: <strong className="text-slate-300">{authProviderType === 'firebase' ? 'Firebase Production Auth' : 'Developer Sandbox Store'}</strong></span>
                <span>Registered: <strong className="text-slate-300">{new Date(userProfile.createdAt).toLocaleDateString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-[#182c44] bg-slate-50/50 dark:bg-[#0b1828] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-xs hover:opacity-90 transition shadow-sm"
            >
              Close Profile
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
