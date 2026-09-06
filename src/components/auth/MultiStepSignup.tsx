import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Briefcase, 
  Building2, 
  HardHat, 
  ClipboardCheck, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth, ROLE_DISPLAY_NAMES } from '../../context/AuthContext';
import { PrimaryRole, UserRoleDetails } from '../../types';

interface MultiStepSignupProps {
  onSwitchToLogin: () => void;
}

export const MultiStepSignup: React.FC<MultiStepSignupProps> = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { signUp, authProviderType } = useAuth();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Account Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 2: Role Selection
  const [selectedRole, setSelectedRole] = useState<PrimaryRole>('SENIOR_PROJECT_DIRECTOR');

  // Step 3: Role-Specific Details
  const [roleDetails, setRoleDetails] = useState<UserRoleDetails>({
    entityType: 'Organization',
    country: 'United States',
    city: 'New York',
    organizationName: '',
    intendedUse: 'Corporate Project',
    yearsExperience: 10,
    primaryDiscipline: 'Civil & Structural Engineering',
    professionalBody: 'ASCE / SEI',
    registrationNumber: '',
    companyName: '',
    yearsOperating: 5,
    specialties: ['Commercial Core & Shell', 'High-Rise Residential'],
  });

  // Step 4: Terms & Privacy
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  // Validation for Step 1
  const validateStep1 = () => {
    setErrorMessage(null);
    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('Please enter your full first and last name.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid business or professional email address.');
      return false;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMessage('Please provide a valid contact phone number.');
      return false;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return false;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage('Password must contain at least one letter and one number.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  // Validation for Step 3
  const validateStep3 = () => {
    setErrorMessage(null);
    if (!roleDetails.country?.trim()) {
      setErrorMessage('Please specify your country / primary jurisdiction.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage('You must acknowledge the Construction Governance Terms and Privacy Policy to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        primaryRole: selectedRole,
        roleDetails,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Account registration could not be completed.');
        setIsSubmitting(false);
      } else {
        // Success: Redirect straight into workspace
        navigate('/app');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during account creation.');
      setIsSubmitting(false);
    }
  };

  const roleCards: {
    id: PrimaryRole;
    title: string;
    desc: string;
    icon: React.ReactNode;
    verificationNote: string;
  }[] = [
    {
      id: 'OWNER_CLIENT',
      title: 'Owner / Client',
      desc: 'Owns, commissions or represents the capital party responsible for the construction project.',
      icon: <Building2 className="w-5 h-5 text-amber-500" />,
      verificationNote: 'Owner Authority Verification (No statutory engineering degree required)',
    },
    {
      id: 'SENIOR_PROJECT_DIRECTOR',
      title: 'Senior Project Director',
      desc: 'Leads project delivery, coordination, technical administration, EVM analysis, and governance.',
      icon: <Briefcase className="w-5 h-5 text-blue-500" />,
      verificationNote: 'Professional Engineering Verification status will be initialized as Not Started',
    },
    {
      id: 'GENERAL_CONTRACTOR',
      title: 'General Contractor',
      desc: 'Responsible for construction execution, site operations, trade subcontractors, and daily shift logs.',
      icon: <HardHat className="w-5 h-5 text-emerald-500" />,
      verificationNote: 'Contractor License Verification status will be initialized as Not Started',
    },
    {
      id: 'STRUCTURAL_QA_QC_AUDITOR',
      title: 'Structural QA/QC Auditor',
      desc: 'Provides independent Quality Assurance / Quality Control inspection, defect findings, and statutory sign-offs.',
      icon: <ClipboardCheck className="w-5 h-5 text-indigo-500" />,
      verificationNote: 'Statutory QA/QC Auditor Credentials will be initialized as Not Started',
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#08121e] border border-slate-200 dark:border-[#182c44] rounded-2xl shadow-xl overflow-hidden">
      {/* Stepper Progress Bar */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200 dark:border-[#14263a] bg-slate-50/70 dark:bg-[#0b1726]">
        <div className="flex items-center justify-between max-w-xl mx-auto mb-3">
          {[
            { num: 1, label: 'Account' },
            { num: 2, label: 'Role' },
            { num: 3, label: 'Profile' },
            { num: 4, label: 'Review' },
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : isCurrent
                      ? 'bg-[#0B192C] dark:bg-amber-500 text-white dark:text-slate-950 ring-4 ring-amber-500/20 font-bold'
                      : 'bg-slate-200 dark:bg-[#14263a] text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Auth Provider Environment Status Pill */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
          <span>Step {currentStep} of 4</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200/80 dark:bg-[#14283f] text-slate-700 dark:text-slate-300">
            {authProviderType === 'firebase' ? 'Firebase Auth Mode' : 'Sandbox Persistence Mode'}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6 sm:p-8">
        {/* STEP 1: ACCOUNT DETAILS */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Create your Structura Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your professional credentials. All enterprise actions are immutably tied to this identity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Eleanor"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Work / Professional Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Direct Contact Phone *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password * (min 8 chars, letter + number)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-amber-500 transition font-medium"
              >
                Already have an account? <strong className="text-amber-500 underline">Sign In</strong>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Role Selection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: ROLE SELECTION */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-5"
          >
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                What role will you primarily use Structura as?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select your primary stakeholder capacity. Your workspace navigation and governance clearance will be established accordingly.
              </p>
            </div>

            {/* Core Principle Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="text-[11px] leading-relaxed">
                <strong>Governance Principle:</strong> Role declaration establishes account identity. Professional engineering verification for statutory sign-offs remains strictly <strong>Not Started</strong> until independent verification in Sprint 03.
              </div>
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roleCards.map((rc) => {
                const isSelected = selectedRole === rc.id;
                return (
                  <div
                    key={rc.id}
                    onClick={() => setSelectedRole(rc.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition text-left relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/10 shadow-md ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-[#182c44] bg-slate-50 dark:bg-[#0b1726] hover:border-slate-300 dark:hover:border-[#223f60]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-white dark:bg-[#122338] border border-slate-200 dark:border-[#1b3452]">
                            {rc.icon}
                          </div>
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                            {rc.title}
                          </h4>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500 text-slate-950'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {rc.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#14263a] text-[10px] text-slate-500 dark:text-slate-400 italic">
                      {rc.verificationNote}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#182c44] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#122338] transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Profile Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: ROLE-SPECIFIC PROFILE */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-5"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                  Step 3 · Profile Customization
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {ROLE_DISPLAY_NAMES[selectedRole]} Profile Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Provide basic domain profile parameters relevant to your scope of responsibility.
              </p>
            </div>

            {/* OWNER / CLIENT SPECIFIC FIELDS */}
            {selectedRole === 'OWNER_CLIENT' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Client Representation Type
                    </label>
                    <select
                      value={roleDetails.entityType}
                      onChange={(e) => setRoleDetails({ ...roleDetails, entityType: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Individual">Individual Asset Owner / Private Investor</option>
                      <option value="Organization">Corporate Developer / Institutional Entity</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Entity / Holding Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={roleDetails.organizationName || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, organizationName: e.target.value })}
                      placeholder="e.g. Apex Holdings LLC"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Country / Jurisdiction *
                    </label>
                    <input
                      type="text"
                      value={roleDetails.country || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, country: e.target.value })}
                      placeholder="e.g. United Kingdom"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      City of Principal Operations
                    </label>
                    <input
                      type="text"
                      value={roleDetails.city || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, city: e.target.value })}
                      placeholder="e.g. London"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Primary Intended Project Use
                  </label>
                  <select
                    value={roleDetails.intendedUse}
                    onChange={(e) => setRoleDetails({ ...roleDetails, intendedUse: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Personal Development">Personal Development / High-End Residence</option>
                    <option value="Real Estate Development">Real Estate Commercial / Multi-Family</option>
                    <option value="Corporate Project">Corporate HQ / Logistics Facility</option>
                    <option value="Public / Institutional Project">Public / Institutional Infrastructure</option>
                    <option value="Other">Other Construction Portfolio</option>
                  </select>
                </div>
              </div>
            )}

            {/* SENIOR PROJECT DIRECTOR FIELDS */}
            {selectedRole === 'SENIOR_PROJECT_DIRECTOR' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Years of Project Leadership Experience *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={roleDetails.yearsExperience || 10}
                      onChange={(e) => setRoleDetails({ ...roleDetails, yearsExperience: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Primary Engineering Discipline *
                    </label>
                    <select
                      value={roleDetails.primaryDiscipline}
                      onChange={(e) => setRoleDetails({ ...roleDetails, primaryDiscipline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Civil & Structural Engineering">Civil & Structural Engineering</option>
                      <option value="Construction Management & Delivery">Construction Management & Delivery</option>
                      <option value="Commercial Architecture & PM">Commercial Architecture & PM</option>
                      <option value="MEP & Building Systems Engineering">MEP & Building Systems Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Country of Practice *
                    </label>
                    <input
                      type="text"
                      value={roleDetails.country || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, country: e.target.value })}
                      placeholder="e.g. United States"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Professional Body (Optional)
                    </label>
                    <input
                      type="text"
                      value={roleDetails.professionalBody || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, professionalBody: e.target.value })}
                      placeholder="e.g. ICE / ASCE / RICS"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registration No. (Optional)
                    </label>
                    <input
                      type="text"
                      value={roleDetails.registrationNumber || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, registrationNumber: e.target.value })}
                      placeholder="e.g. PE-489201"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* GENERAL CONTRACTOR FIELDS */}
            {selectedRole === 'GENERAL_CONTRACTOR' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Contractor Entity Type
                    </label>
                    <select
                      value={roleDetails.entityType}
                      onChange={(e) => setRoleDetails({ ...roleDetails, entityType: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Organization">Incorporated Construction Company</option>
                      <option value="Individual">Individual General Contractor / Master Builder</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Company / Operating Trading Name *
                    </label>
                    <input
                      type="text"
                      value={roleDetails.companyName || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, companyName: e.target.value })}
                      placeholder="e.g. BuildCorp Construction Ltd."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Years in Operation
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={roleDetails.yearsOperating || 8}
                      onChange={(e) => setRoleDetails({ ...roleDetails, yearsOperating: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Country of Operation *
                    </label>
                    <input
                      type="text"
                      value={roleDetails.country || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, country: e.target.value })}
                      placeholder="e.g. Canada"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STRUCTURAL QA/QC AUDITOR FIELDS */}
            {selectedRole === 'STRUCTURAL_QA_QC_AUDITOR' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Inspection & Audit Experience (Years) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={roleDetails.yearsExperience || 12}
                      onChange={(e) => setRoleDetails({ ...roleDetails, yearsExperience: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Structural QA/QC Specialty *
                    </label>
                    <select
                      value={roleDetails.primaryDiscipline}
                      onChange={(e) => setRoleDetails({ ...roleDetails, primaryDiscipline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Reinforced Concrete & Post-Tensioning">Reinforced Concrete & Post-Tensioning</option>
                      <option value="Structural Steelwork & Welding NDT">Structural Steelwork & Welding NDT</option>
                      <option value="Deep Foundations & Geotechnical QA">Deep Foundations & Geotechnical QA</option>
                      <option value="Building Envelope & Structural Forensic">Building Envelope & Structural Forensic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Country of Practice *
                    </label>
                    <input
                      type="text"
                      value={roleDetails.country || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, country: e.target.value })}
                      placeholder="e.g. Germany"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Professional Registration Body
                    </label>
                    <input
                      type="text"
                      value={roleDetails.professionalBody || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, professionalBody: e.target.value })}
                      placeholder="e.g. Board of Structural Engineers"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registration / License Number
                    </label>
                    <input
                      type="text"
                      value={roleDetails.registrationNumber || ''}
                      onChange={(e) => setRoleDetails({ ...roleDetails, registrationNumber: e.target.value })}
                      placeholder="e.g. SE-98214"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#182c44] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#122338] transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-2 shadow-sm"
              >
                <span>Continue to Review & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 4: REVIEW & CREATE ACCOUNT */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Review & Finalize Account Creation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Confirm your registration credentials. Upon submission, an authenticated session and persistent UserProfile will be issued.
                </p>
              </div>

              {/* Review Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b1726] border border-slate-200 dark:border-[#182c44] space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-[#14263a]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Account Holder</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {firstName} {lastName}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Contact Email</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">{email}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200 dark:border-[#14263a]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Selected Primary Role</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-bold">
                      {ROLE_DISPLAY_NAMES[selectedRole]}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Direct Phone</span>
                    <strong className="text-slate-900 dark:text-white font-semibold">{phone}</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div>
                    <span>Jurisdiction: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{roleDetails.country}</strong>
                  </div>
                  {roleDetails.primaryDiscipline && (
                    <div>
                      <span>Discipline: </span>
                      <strong className="text-slate-800 dark:text-slate-200">{roleDetails.primaryDiscipline}</strong>
                    </div>
                  )}
                  {roleDetails.companyName && (
                    <div>
                      <span>Organization: </span>
                      <strong className="text-slate-800 dark:text-slate-200">{roleDetails.companyName}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal & Governance Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-600"
                    required
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    I agree to the <strong>Structura Enterprise Construction Governance Terms</strong>. I understand that all approvals, reports, and site logs are permanently recorded under this authenticated identity.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-600"
                    required
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    I acknowledge that role declaration establishes account identity, and statutory sign-off authority remains pending independent professional credential verification (Sprint 03).
                  </span>
                </label>
              </div>

              <div className="pt-3 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#182c44] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-[#122338] transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !agreeTerms || !agreePrivacy}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account & Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </form>
        )}
      </div>
    </div>
  );
};
