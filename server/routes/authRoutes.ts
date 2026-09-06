import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { requireAuth, sandboxSessionStore, getAuthMode } from '../middleware/authMiddleware';
import { isFirebaseAdminAvailable, verifyFirebaseToken } from '../auth/firebaseAdmin';
import { userService } from '../services/userService';
import { userRepository, PrimaryRole, UserRoleDetails } from '../repositories/userRepository';
import { updateProfileSchema } from '../validation/schemas';
import { governanceService } from '../services/governanceService';

export const authRouter = Router();

// GET /api/auth/status
// Returns the active configuration status of Firebase Auth and Server Persistence
authRouter.get('/status', (req: Request, res: Response) => {
  const adminConfigured = isFirebaseAdminAvailable();
  const hasClientKey = Boolean(process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY);
  const activeMode = getAuthMode();
  
  res.json({
    firebaseConfigured: adminConfigured,
    hasClientKey,
    authMode: activeMode === 'firebase' ? 'FIREBASE_PRODUCTION' : 'DEVELOPER_SANDBOX_PREVIEW',
    persistenceEngine: (activeMode === 'firebase' && adminConfigured) ? 'FIRESTORE' : 'FILE_PERSISTENCE',
    configuredAuthModeEnv: process.env.STRUCTURA_AUTH_MODE || 'auto',
    requiredEnvVars: {
      client: [
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_AUTH_DOMAIN',
        'VITE_FIREBASE_PROJECT_ID',
        'VITE_FIREBASE_STORAGE_BUCKET',
        'VITE_FIREBASE_MESSAGING_SENDER_ID',
        'VITE_FIREBASE_APP_ID'
      ],
      server: [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'FIREBASE_PRIVATE_KEY'
      ]
    },
    message: activeMode === 'firebase'
      ? 'Firebase Authentication & Admin SDK are active in production mode.'
      : 'Structura Developer Sandbox Auth is active with server-side file persistence.',
  });
});

// POST /api/auth/register-profile
// Creates or links a persistent Structura UserProfile for an authenticated user
authRouter.post('/register-profile', async (req: Request, res: Response) => {
  try {
    const { 
      authUserId, 
      email, 
      firstName, 
      lastName, 
      phone, 
      primaryRole, 
      roleDetails 
    } = req.body;

    if (!email || !firstName || !lastName || !primaryRole) {
      return res.status(400).json({
        error: 'Missing required profile fields (email, firstName, lastName, primaryRole)',
      });
    }

    const validRoles: PrimaryRole[] = [
      'OWNER_CLIENT', 
      'SENIOR_PROJECT_DIRECTOR', 
      'GENERAL_CONTRACTOR', 
      'STRUCTURAL_QA_QC_AUDITOR'
    ];

    if (!validRoles.includes(primaryRole)) {
      return res.status(400).json({
        error: `Invalid primaryRole. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const profile = await userService.createProfile({
      authUserId: authUserId || `auth_${crypto.randomUUID()}`,
      email,
      firstName,
      lastName,
      phone: phone || '',
      primaryRole,
      roleDetails: roleDetails || {},
    });

    return res.status(201).json({
      success: true,
      profile,
      message: 'Structura UserProfile successfully created and persisted.',
    });
  } catch (error: any) {
    console.error('[authRouter] Error in /register-profile:', error);
    return res.status(500).json({
      error: 'Failed to create Structura UserProfile',
      details: error.message,
    });
  }
});

// POST /api/auth/sandbox-signup
// Facilitates registration when external Firebase credentials are not yet configured in environment
authRouter.post('/sandbox-signup', async (req: Request, res: Response) => {
  try {
    // Part A2: Sandbox registration must be disabled when STRUCTURA_AUTH_MODE=firebase
    if (getAuthMode() === 'firebase') {
      return res.status(403).json({
        error: 'Forbidden: Sandbox registration is disabled when STRUCTURA_AUTH_MODE=firebase. Use Firebase Authentication.',
        code: 'SANDBOX_DISABLED_IN_PROD',
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      primaryRole,
      roleDetails,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !primaryRole) {
      return res.status(400).json({
        error: 'Missing mandatory registration fields.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long.',
      });
    }

    // Check if user email already exists
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    const authUserId = `usr_${crypto.randomUUID().substring(0, 8)}`;
    // Part A4: Hash password with 32-byte salt using 100,000 PBKDF2 rounds
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const passwordHash = `${salt}:${hash}`;

    const profile = await userService.createProfile({
      authUserId,
      email,
      firstName,
      lastName,
      phone: phone || '',
      primaryRole,
      roleDetails: roleDetails || {},
      passwordHash,
    });

    // Create session token with 24-hour expiry (Part A4)
    const token = `sb_sess_${crypto.randomUUID()}`;
    const now = Date.now();
    sandboxSessionStore.set(token, {
      uid: authUserId,
      email: profile.email,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        uid: authUserId,
        email: profile.email,
        displayName: `${profile.firstName} ${profile.lastName}`,
      },
      profile,
      isSandbox: true,
      message: 'Account and persistent profile created successfully.',
    });
  } catch (error: any) {
    console.error('[authRouter] Error in sandbox-signup:', error);
    return res.status(500).json({
      error: 'Registration failed due to server error',
      details: error.message,
    });
  }
});

// POST /api/auth/sandbox-login
// Authenticates user when external Firebase is pending
authRouter.post('/sandbox-login', async (req: Request, res: Response) => {
  try {
    // Part A2: Sandbox login must be disabled when STRUCTURA_AUTH_MODE=firebase
    if (getAuthMode() === 'firebase') {
      return res.status(403).json({
        error: 'Forbidden: Sandbox login is disabled when STRUCTURA_AUTH_MODE=firebase. Use Firebase Authentication.',
        code: 'SANDBOX_DISABLED_IN_PROD',
      });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required.',
      });
    }

    const userProfile = await userRepository.findByEmail(email);
    if (!userProfile || !userProfile.passwordHash) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    const [salt, storedHash] = userProfile.passwordHash.split(':');
    // Compute with 100,000 rounds
    let computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    
    // Backward compatibility with Sprint 02 initial 1,000 iteration test accounts
    if (computedHash !== storedHash) {
      const legacyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
      if (legacyHash === storedHash) {
        // Upgrade password hash to 100,000 rounds automatically
        const newSalt = crypto.randomBytes(32).toString('hex');
        const upgradedHash = crypto.pbkdf2Sync(password, newSalt, 100000, 64, 'sha512').toString('hex');
        await userRepository.update(userProfile.id, { passwordHash: `${newSalt}:${upgradedHash}` });
        computedHash = storedHash;
      }
    }

    if (computedHash !== storedHash) {
      return res.status(401).json({
        error: 'Invalid email or password.',
      });
    }

    // Create authenticated session token with 24-hour expiry
    const token = `sb_sess_${crypto.randomUUID()}`;
    const now = Date.now();
    sandboxSessionStore.set(token, {
      uid: userProfile.authUserId,
      email: userProfile.email,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token,
      user: {
        uid: userProfile.authUserId,
        email: userProfile.email,
        displayName: `${userProfile.firstName} ${userProfile.lastName}`,
      },
      profile: userProfile,
      isSandbox: true,
    });
  } catch (error: any) {
    console.error('[authRouter] Error in sandbox-login:', error);
    return res.status(500).json({
      error: 'Authentication failed due to server error',
    });
  }
});

// GET /api/users/me
// Protected endpoint: returns current authenticated user profile
authRouter.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    let profile = req.userProfile;

    if (!profile) {
      profile = await userService.getProfileByAuthUserId(user.uid);
    }

    if (!profile && user.email) {
      profile = await userService.getProfileByEmail(user.email);
    }

    return res.json({
      authenticated: true,
      user,
      profile: profile || null,
    });
  } catch (error: any) {
    console.error('[authRouter] Error in /me:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Helper function to validate and execute safe profile updates (Part A1)
async function handleSafeProfileUpdate(req: Request, res: Response) {
  try {
    const profile = req.userProfile;
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Explicit rejection of mass assignment of protected fields (Part A1)
    const prohibitedFields = [
      'authUserId',
      'primaryRole',
      'accountStatus',
      'identityStatus',
      'professionalVerificationStatus',
      'createdAt',
      'passwordHash',
      'id'
    ];

    const attemptedProhibited = prohibitedFields.filter(field => field in req.body);
    if (attemptedProhibited.length > 0) {
      return res.status(400).json({
        error: `Security Violation: The following security-sensitive fields cannot be modified via self-service: [${attemptedProhibited.join(', ')}].`,
        code: 'PROHIBITED_PROFILE_FIELD_MODIFICATION',
      });
    }

    // Validate request body using strict Zod schema
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Validation failed for profile update payload.',
        details: parseResult.error.format(),
        code: 'INVALID_PAYLOAD',
      });
    }

    const { firstName, lastName, phone, roleDetails } = parseResult.data;
    const updated = await userService.updateProfile(profile.id, {
      firstName,
      lastName,
      phone,
      roleDetails: roleDetails as any,
    });

    return res.json({
      success: true,
      profile: updated,
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    console.error('[authRouter] Error in profile update:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
}

// PUT /api/users/profile
authRouter.put('/profile', requireAuth, handleSafeProfileUpdate);

// PUT /api/users/me (Part A1 requirement)
authRouter.put('/me', requireAuth, handleSafeProfileUpdate);

// GET /api/professionals (Part F - Professional Discovery Directory)
authRouter.get('/professionals', requireAuth, async (req: Request, res: Response) => {
  try {
    const { role, search, country } = req.query;
    if (!role) {
      return res.status(400).json({ error: 'Role query parameter is required' });
    }
    const results = await governanceService.discoverProfessionals(
      role as any, 
      search as string | undefined, 
      country as string | undefined
    );
    return res.json(results);
  } catch (error: any) {
    console.error('[authRouter] Error discovering professionals:', error);
    return res.status(500).json({ error: 'Failed to search professionals' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1]?.trim();
    if (token) {
      sandboxSessionStore.delete(token);
    }
  }
  return res.json({ success: true, message: 'Session logged out' });
});
