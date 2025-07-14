import { AuthUser } from '@/types/auth';
import { Profile } from '@/types/database';
import { User } from '@/types/legacy';

export function createUserFromAuth(authUser: AuthUser, profile: Profile): User {
  return {
    id: authUser.id,
    name: profile.full_name || 'User',
    email: authUser.email || '',
    role: profile.role,
    permissions: profile.permissions || [],
    mosqueId: profile.mosque_id || undefined,
    mosqueName: '', // Will be populated when mosque data is integrated
    phone: profile.phone || undefined,
    membershipId: 'MSJ001', // This would come from member data
    joinDate: profile.created_at,
    membershipType: 'all' as const,
    icNumber: profile.username || undefined, // Temporary mapping
    address: '', // Will be added to profile later
    beneficiaries: [],
    emergencyContact: undefined,
  };
}
