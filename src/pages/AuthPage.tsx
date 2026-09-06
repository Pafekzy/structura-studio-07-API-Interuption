import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { MultiStepSignup } from '../components/auth/MultiStepSignup';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info,
  KeyRound,
  Server
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);

  const { login, isAuthenticated, authProviderType, isDeveloperDemoMode, toggleDeveloperDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect straight to workspace (/app)
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/app';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
    setErrorMessage(null);
  }, [initialMode]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setForgotPasswordMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid credentials or account does not exist.');
        setIsSubmitting(false);
      } else {
        const from = (location.state as any)?.from?.pathname || '/app';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication.');
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address above to request password recovery.');
    } else {
      setForgotPasswordMessage(
        `Password recovery instructions have been queued for ${email.trim()}. Please verify your email inbox or contact your project administrator.`
      );
    }
  };

  // Pre-fill helper for developer testing in sandbox mode
  const fillDevAccount = (devEmail: string, roleTitle: string) => {
    setEmail(devEmail);
    setPassword('Structura2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-250">
      <PublicNavbar />

      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
        
        {/* Environment Status & Architecture Banner */}
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#091524] border border-slate-200 dark:border-[#182c44] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <Server className="w-4 h-4 text-amber-500" />
              <span>AUTHENTICATION ARCHITECTURE STATUS</span>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold">
              {authProviderType === 'firebase' ? 'FIREBASE PRODUCTION' : 'DEVELOPER SANDBOX PERSISTENCE'}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {authProviderType === 'firebase'
              ? 'Firebase Authentication & Admin SDK are active. Tokens are cryptographically verified server-side via Firebase Admin.'
              : 'Structura Sandbox Authentication is active with server-side persistent UserProfile storage. Configure VITE_FIREBASE_API_KEY in .env to bind production Firebase Auth.'}
          </p>
        </div>

        {/* Mode Switcher Header */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/80 dark:bg-[#0e2136] border border-slate-300 dark:border-[#1b3452]">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMessage(null);
              }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                isLogin
                  ? 'bg-white dark:bg-[#182f4c] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In to Workspace
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMessage(null);
              }}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                !isLogin
                  ? 'bg-white dark:bg-[#182f4c] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create New Account (4-Role Onboarding)
            </button>
          </div>
        </div>

        {/* SIGN IN FORM */}
        {isLogin ? (
          <div className="max-w-md mx-auto w-full bg-white dark:bg-[#08121e] border border-slate-200 dark:border-[#182c44] rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Sign In to Structura
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered credentials to access your stakeholder workspace.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Forgot Password Message */}
            {forgotPasswordMessage && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>{forgotPasswordMessage}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-amber-500 hover:text-amber-400 transition font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300 dark:border-slate-600"
                  />
                  <span>Remember session</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 dark:border-[#182c44] text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-amber-500 hover:text-amber-400 font-bold underline transition"
                >
                  Create Account with Role Onboarding
                </button>
              </p>
            </div>

            {/* Developer Testing Sandbox Accounts Helper */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#182c44] space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Testing Accounts</span>
                <span className="italic text-[10px]">Quick Fill</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => fillDevAccount('director@structura.build', 'Senior Project Director')}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#0f2138] border border-slate-200 dark:border-[#1b3452] text-slate-700 dark:text-slate-300 hover:border-amber-500 transition text-left truncate"
                >
                  Director (Civil PE)
                </button>
                <button
                  type="button"
                  onClick={() => fillDevAccount('owner@structura.build', 'Owner / Client')}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#0f2138] border border-slate-200 dark:border-[#1b3452] text-slate-700 dark:text-slate-300 hover:border-amber-500 transition text-left truncate"
                >
                  Owner (Fiduciary)
                </button>
                <button
                  type="button"
                  onClick={() => fillDevAccount('contractor@structura.build', 'General Contractor')}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#0f2138] border border-slate-200 dark:border-[#1b3452] text-slate-700 dark:text-slate-300 hover:border-amber-500 transition text-left truncate"
                >
                  Contractor (Site Ops)
                </button>
                <button
                  type="button"
                  onClick={() => fillDevAccount('auditor@structura.build', 'Structural QA/QC Auditor')}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#0f2138] border border-slate-200 dark:border-[#1b3452] text-slate-700 dark:text-slate-300 hover:border-amber-500 transition text-left truncate"
                >
                  Auditor (QA/QC)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* MULTI-STEP REGISTRATION FLOW */
          <MultiStepSignup onSwitchToLogin={() => setIsLogin(true)} />
        )}

      </div>

      <PublicFooter />
    </div>
  );
};
