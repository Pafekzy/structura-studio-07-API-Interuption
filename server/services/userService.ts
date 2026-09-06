import { userRepository, UserProfile, PrimaryRole, UserRoleDetails } from '../repositories/userRepository';
import crypto from 'crypto';

export interface CreateProfileDto {
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  primaryRole: PrimaryRole;
  roleDetails?: UserRoleDetails;
  passwordHash?: string;
}

export class UserService {
  async createProfile(dto: CreateProfileDto): Promise<UserProfile> {
    const existing = await userRepository.findByAuthUserId(dto.authUserId);
    if (existing) {
      return existing;
    }

    const existingByEmail = await userRepository.findByEmail(dto.email);
    if (existingByEmail) {
      // Return existing or attach authUserId if not matched
      return existingByEmail;
    }

    // Role-based Verification Status assignment
    // OWNER_CLIENT does not require engineering qualifications
    // Professional roles are strictly NOT_STARTED upon registration
    const professionalVerificationStatus = 
      dto.primaryRole === 'OWNER_CLIENT' ? 'NOT_REQUIRED' : 'NOT_STARTED';

    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      id: `usr_${crypto.randomUUID()}`,
      authUserId: dto.authUserId,
      email: dto.email.toLowerCase().trim(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone.trim(),
      primaryRole: dto.primaryRole,
      accountStatus: 'ACTIVE',
      identityStatus: 'NOT_STARTED',
      professionalVerificationStatus,
      roleDetails: dto.roleDetails || {},
      createdAt: now,
      updatedAt: now,
      passwordHash: dto.passwordHash,
    };

    const saved = await userRepository.create(newProfile);
    return saved;
  }

  async getProfileByAuthUserId(authUserId: string): Promise<UserProfile | null> {
    return userRepository.findByAuthUserId(authUserId);
  }

  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    return userRepository.findByEmail(email);
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    // Prohibit updating role directly or faking verification status through basic updates
    const safeUpdates: Partial<UserProfile> = {
      firstName: updates.firstName,
      lastName: updates.lastName,
      phone: updates.phone,
      roleDetails: updates.roleDetails,
    };
    return userRepository.update(id, safeUpdates);
  }
}

export const userService = new UserService();
