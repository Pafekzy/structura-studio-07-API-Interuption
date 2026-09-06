import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UserProfile, 
  PrimaryRole, 
  UserRole, 
  UserRoleDetails 
} from '../types';
import { 
  auth, 
  isFirebaseConfigured, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  firebaseSignOut,
  onAuthStateChanged,
  User 
} from '../lib/firebase';

export interface SignUpFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  primaryRole: PrimaryRole;
  roleDetails?: UserRoleDetails;
}

export const ROLE_DISPLAY_NAMES: Record<PrimaryRole, UserRole> = {
  OWNER_CLIENT: 'Owner / Client',
  SENIOR_PROJECT_DIRECTOR: 'Senior Project Director',
  GENERAL_CONTRACTOR: 'General Contractor',
  STRUCTURAL_QA_QC_AUDITOR: 'Structural QA/QC Auditor',
};

export const ROLE_FROM_DISPLAY: Record<UserRole, PrimaryRole> = {
  'Owner / Client': 'OWNER_CLIENT',
  'Senior Project Director': 'SENIOR_PROJECT_DIRECTOR',
  'General Contractor': 'GENERAL_CONTRACTOR',
  'Structural QA/QC Auditor': 'STRUCTURAL_QA_QC_AUDITOR',
};

interface AuthContextType {
  user: { uid: string; email: string; displayName?: string } | null;
  userProfile: UserProfile | null;
  primaryRole: PrimaryRole | null;
  userRole: UserRole;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  idToken: string | null;
  authProviderType: 'firebase' | 'server_sandbox';
  isDeveloperDemoMode: boolean;
  toggleDeveloperDemoMode: () => void;
  setDeveloperActiveRole: (role: UserRole) => void;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'structura_auth_session';
const DEV_MODE_STORAGE_KEY = 'structura_dev_demo_mode';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authProviderType, setAuthProviderType] = useState<'firebase' | 'server_sandbox'>('server_sandbox');
  
  // Developer Demo Mode: Explicitly allowed only in development or with explicit env flag
  const isDevModeAllowed = Boolean(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEVELOPER_DEMO_MODE === 'true');

  const [isDeveloperDemoMode, setIsDeveloperDemoMode] = useState<boolean>(() => {
    if (!isDevModeAllowed) return false;
    try {
      return localStorage.getItem(DEV_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [developerOverrideRole, setDeveloperOverrideRole] = useState<UserRole | null>(null);

  // Derive the user's primary display role from their persistent Structura UserProfile
  const primaryRole: PrimaryRole | null = userProfile?.primaryRole || null;
  const userRole: UserRole = primaryRole ? ROLE_DISPLAY_NAMES[primaryRole] : 'Owner / Client';
  
  // Active role is strictly locked to the authenticated user's primary role unless Developer Demo Mode is active
  const activeRole: UserRole = isDevModeAllowed && isDeveloperDemoMode && developerOverrideRole 
    ? developerOverrideRole 
    : userRole;

  const toggleDeveloperDemoMode = () => {
    if (!isDevModeAllowed) {
      console.warn('[Security] Developer Demo Mode is disabled in this environment.');
      return;
    }
    setIsDeveloperDemoMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(DEV_MODE_STORAGE_KEY, String(next));
      } catch (e) {
        console.warn('Could not persist dev mode preference', e);
      }
      if (!next) {
        setDeveloperOverrideRole(null);
      }
      return next;
    });
  };

  const setDeveloperActiveRole = (role: UserRole) => {
    if (isDevModeAllowed && isDeveloperDemoMode) {
      setDeveloperOverrideRole(role);
    } else {
      console.warn('[Security] Role switching blocked: Developer Demo Mode is disabled');
    }
  };

  // Helper to fetch persistent profile from server
  const fetchUserProfile = useCallback(async (token: string, fallbackUid?: string, fallbackEmail?: string) => {
    try {
      const res = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setUserProfile(data.profile);
          return data.profile;
        }
      } else {
        console.warn('[AuthContext] Could not fetch profile from server, status:', res.status);
      }
    } catch (err) {
      console.error('[AuthContext] Error fetching profile:', err);
    }
    return null;
  }, []);

  // Restore session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. If Firebase Client is configured, listen to Firebase Auth State
      if (isFirebaseConfigured && auth) {
        setAuthProviderType('firebase');
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
          if (!isMounted) return;
          if (firebaseUser) {
            try {
              const token = await firebaseUser.getIdToken();
              setIdToken(token);
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || undefined,
              });
              await fetchUserProfile(token, firebaseUser.uid, firebaseUser.email || '');
            } catch (error) {
              console.error('[AuthContext] Error processing Firebase user state:', error);
            }
          } else {
            setUser(null);
            setUserProfile(null);
            setIdToken(null);
          }
          setIsLoading(false);
        });

        return () => unsubscribe();
      }

      // 2. Fallback: Restore Developer Sandbox Session from local storage
      setAuthProviderType('server_sandbox');
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          if (session?.token && session?.user) {
            setIdToken(session.token);
            setUser(session.user);
            // Fetch latest persisted profile from server
            const profile = await fetchUserProfile(session.token);
            if (!profile && session.profile) {
              setUserProfile(session.profile);
            }
          }
        }
      } catch (e) {
        console.warn('[AuthContext] Could not read stored auth session:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [fetchUserProfile]);

  // Login handler
  const login = async (email: string, password: string, remember: boolean = true) => {
    setIsLoading(true);
    try {
      // 1. If Firebase is configured, perform real Firebase Client login
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        const profile = await fetchUserProfile(token, cred.user.uid, cred.user.email || '');
        
        setUser({
          uid: cred.user.uid,
          email: cred.user.email || email,
          displayName: cred.user.displayName || (profile ? `${profile.firstName} ${profile.lastName}` : email),
        });
        setIdToken(token);
        setIsLoading(false);
        return { success: true };
      }

      // 2. Otherwise authenticate against Server Sandbox Auth Endpoint
      const res = await fetch('/api/auth/sandbox-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Authentication failed' };
      }

      const session = {
        token: data.token,
        user: data.user,
        profile: data.profile,
      };

      if (remember) {
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
          console.warn('Could not save session to localStorage', e);
        }
      }

      setIdToken(data.token);
      setUser(data.user);
      setUserProfile(data.profile);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : err.message || 'Login failed';
      return { success: false, error: msg };
    }
  };

  // Sign up handler
  const signUp = async (formData: SignUpFormData) => {
    setIsLoading(true);
    try {
      // 1. If Firebase is configured, create Firebase Account then register Structura profile
      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const token = await cred.user.getIdToken();

        // Register Structura persistent UserProfile on backend
        const regRes = await fetch('/api/auth/register-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            authUserId: cred.user.uid,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            primaryRole: formData.primaryRole,
            roleDetails: formData.roleDetails,
          }),
        });

        if (!regRes.ok) {
          const errData = await regRes.json();
          // Partial failure handled explicitly
          setIsLoading(false);
          return { 
            success: false, 
            error: `Authentication account created, but Structura profile initialization failed: ${errData.error || 'Server error'}. Please contact support or try logging in.` 
          };
        }

        const regData = await regRes.json();
        setUser({
          uid: cred.user.uid,
          email: formData.email,
          displayName: `${formData.firstName} ${formData.lastName}`,
        });
        setUserProfile(regData.profile);
        setIdToken(token);
        setIsLoading(false);
        return { success: true };
      }

      // 2. Sandbox registration against server repository
      const res = await fetch('/api/auth/sandbox-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Registration failed' };
      }

      const session = {
        token: data.token,
        user: data.user,
        profile: data.profile,
      };

      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Could not save session to localStorage', e);
      }

      setIdToken(data.token);
      setUser(data.user);
      setUserProfile(data.profile);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email address is already registered. Please log in.'
        : err.message || 'Registration failed';
      return { success: false, error: msg };
    }
  };

  // Logout handler
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await firebaseSignOut(auth);
      }
      if (idToken) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
          });
        } catch {
          // Ignore network logout errors
        }
      }
    } catch (error) {
      console.warn('Error during sign out:', error);
    } finally {
      // Clear ONLY authentication-related local storage items (rule 8: Do NOT delete project data)
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch (e) {
        console.warn('Could not clear auth storage', e);
      }
      setUser(null);
      setUserProfile(null);
      setIdToken(null);
      setDeveloperOverrideRole(null);
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (idToken) {
      await fetchUserProfile(idToken);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!idToken) return false;
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.profile);
        return true;
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        primaryRole,
        userRole,
        activeRole,
        isAuthenticated: Boolean(user && userProfile),
        isLoading,
        idToken,
        authProviderType,
        isDeveloperDemoMode,
        toggleDeveloperDemoMode,
        setDeveloperActiveRole,
        login,
        signUp,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
