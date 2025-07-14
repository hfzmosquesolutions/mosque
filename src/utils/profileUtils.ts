import { Profile } from '@/types/database';

/**
 * Checks if a user profile is complete enough for general app usage
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;

  // Core required fields for basic functionality
  const hasBasicInfo = !!(profile.full_name && profile.phone && profile.email);

  return hasBasicInfo;
}

/**
 * Checks if a user profile is fully complete with all recommended fields
 */
export function isProfileFullyComplete(profile: Profile | null): boolean {
  if (!isProfileComplete(profile)) return false;

  // Additional recommended fields
  const hasAdditionalInfo = !!profile?.username;

  return hasAdditionalInfo;
}

/**
 * Gets a list of missing required profile fields
 */
export function getMissingProfileFields(profile: Profile | null): string[] {
  const missing: string[] = [];

  if (!profile) return ['profile'];

  if (!profile.full_name) missing.push('full_name');
  if (!profile.phone) missing.push('phone');
  if (!profile.email) missing.push('email');
  if (!profile.username) missing.push('username');

  return missing;
}

/**
 * Gets the profile completion percentage
 */
export function getProfileCompletionPercentage(
  profile: Profile | null
): number {
  if (!profile) return 0;

  const totalFields = 4; // full_name, phone, email, username
  const completedFields = [
    profile.full_name,
    profile.phone,
    profile.email,
    profile.username,
  ].filter(Boolean).length;

  return Math.round((completedFields / totalFields) * 100);
}
