import { useState, useEffect } from 'react';
import { membersService } from '@/services/members';
import type { Database } from '@/types/database';

type Member = Database['public']['Tables']['members']['Row'] & {
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  } | null;
};

type MemberStats = {
  total: number;
  active: number;
  pending: number;
  committee: number;
  newThisMonth: number;
};

export const useMembers = (mosqueId?: string) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [applications, setApplications] = useState<Member[]>([]);
  const [stats, setStats] = useState<MemberStats>({
    total: 0,
    active: 0,
    pending: 0,
    committee: 0,
    newThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!mosqueId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await membersService.getMembers(mosqueId);
      setMembers(data.filter(m => m.status === 'active'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    if (!mosqueId) return;
    try {
      const data = await membersService.getMembers(mosqueId);
      setApplications(data.filter(m => m.status === 'inactive'));
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  const fetchStats = async () => {
    if (!mosqueId) return;
    try {
      const statsData = await membersService.getMemberStats(mosqueId);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch member stats:', err);
    }
  };

  const checkExistingMembership = async (userId: string) => {
    if (!mosqueId) return null;
    try {
      const existing = await membersService.checkExistingMembership(userId, mosqueId);
      return existing;
    } catch (err) {
      console.error('Failed to check existing membership:', err);
      return null;
    }
  };

  const createMembershipApplication = async (memberData: any) => {
    try {
      const newMember = await membersService.createMembershipApplication(memberData);
      await fetchMembers();
      await fetchApplications();
      await fetchStats();
      return newMember;
    } catch (err) {
      throw err;
    }
  };

  const createApplication = createMembershipApplication;

  const approveApplication = async (applicationId: string) => {
    try {
      await membersService.updateMember(applicationId, { status: 'active' });
      await fetchMembers();
      await fetchApplications();
      await fetchStats();
    } catch (err) {
      throw err;
    }
  };

  const rejectApplication = async (applicationId: string) => {
    try {
      await membersService.deleteMember(applicationId);
      await fetchApplications();
      await fetchStats();
    } catch (err) {
      throw err;
    }
  };

  const updateMember = async (id: string, updates: any) => {
    try {
      const updatedMember = await membersService.updateMember(id, updates);
      await fetchMembers();
      await fetchStats();
      return updatedMember;
    } catch (err) {
      throw err;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await membersService.deleteMember(id);
      await fetchMembers();
      await fetchApplications();
      await fetchStats();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    if (mosqueId) {
      fetchMembers();
      fetchStats();
    }
  }, [mosqueId]);

  return {
    members,
    applications,
    stats,
    loading,
    error,
    fetchMembers,
    fetchApplications,
    fetchStats,
    checkExistingMembership,
    createMembershipApplication,
    createApplication,
    updateMember,
    deleteMember,
    approveApplication,
    rejectApplication,
  };
};