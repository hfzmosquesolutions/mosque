import { useState, useEffect, useCallback } from 'react';
import { useAuthState } from '@/hooks/useAuth.v2';
import { khairatService } from '@/services/khairat';
import { MosqueService } from '@/services/api';
import { supabase } from '@/lib/supabase';

export interface DashboardStats {
  totalMembers: number;
  monthlyCollection: number;
  activePrograms: number;
  zakatCollected: number;
  pendingApplications: number;
  khairatStats: {
    totalRecords: number;
    pendingRecords: number;
    totalAmount: number;
  };
}

export interface MemberDashboardStats {
  myKhairatRecords: number;
  myPendingRecords: number;
  myTotalContributions: number;
  myUpcomingPrograms: number;
  myZakatCalculations: number;
}

export interface DashboardActivity {
  id: string;
  type: 'payment' | 'member' | 'zakat' | 'program' | 'khairat';
  message: string;
  time: string;
  timestamp: Date;
}

export function useDashboard() {
  const { profile, user } = useAuthState();
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null);
  const [memberStats, setMemberStats] = useState<MemberDashboardStats | null>(
    null
  );
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = profile?.role !== 'member';
  const isMember = profile?.role === 'member';

  // Load admin dashboard data
  const loadAdminStats = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      setError(null);

      // Get total members count
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get khairat stats
      const khairatRecords = await khairatService.getKhairatRecords();
      const khairatStats = {
        totalRecords: khairatRecords.length,
        pendingRecords: khairatRecords.filter((r) => r.status === 'pending')
          .length,
        totalAmount: khairatRecords.reduce(
          (sum, r) => sum + (r.contribution_amount || 0),
          0
        ),
      };

      // Get finance data (monthly collection)
      const currentMonth = new Date();
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const { data: financeRecords } = await supabase
        .from('finance_records')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString())
        .eq('type', 'income');

      const monthlyCollection =
        financeRecords?.reduce(
          (sum, record) => sum + (record.amount || 0),
          0
        ) || 0;

      // Get programs count
      const { count: activePrograms } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get zakat records for the year
      const currentYear = new Date().getFullYear();
      const { data: zakatRecords } = await supabase
        .from('zakat_calculations')
        .select('zakat_amount')
        .gte('created_at', `${currentYear}-01-01`)
        .lt('created_at', `${currentYear + 1}-01-01`);

      const zakatCollected =
        zakatRecords?.reduce(
          (sum, record) => sum + (record.zakat_amount || 0),
          0
        ) || 0;

      // Get pending applications
      const { count: pendingKhairat } = await supabase
        .from('khairat_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: pendingPrograms } = await supabase
        .from('program_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const pendingApplications =
        (pendingKhairat || 0) + (pendingPrograms || 0);

      setAdminStats({
        totalMembers: totalMembers || 0,
        monthlyCollection,
        activePrograms: activePrograms || 0,
        zakatCollected,
        pendingApplications,
        khairatStats,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data'
      );
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Load member dashboard data
  const loadMemberStats = useCallback(async () => {
    if (!isMember || !user?.email) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's khairat records
      const { data: khairatRecords } = await supabase
        .from('khairat_records')
        .select('*')
        .eq('member_email', user.email);

      const myKhairatRecords = khairatRecords?.length || 0;
      const myPendingRecords =
        khairatRecords?.filter((r) => r.status === 'pending').length || 0;
      const myTotalContributions =
        khairatRecords?.reduce(
          (sum, r) => sum + (r.contribution_amount || 0),
          0
        ) || 0;

      // Get user's program registrations
      const { data: programRegistrations } = await supabase
        .from('program_registrations')
        .select('programs(*)')
        .eq('member_email', user.email)
        .eq('status', 'approved');

      const myUpcomingPrograms =
        programRegistrations?.filter((reg) => {
          const program = reg.programs as any;
          return program && new Date(program.start_date) > new Date();
        }).length || 0;

      // Get user's zakat calculations
      const { count: myZakatCalculations } = await supabase
        .from('zakat_calculations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile?.id);

      setMemberStats({
        myKhairatRecords,
        myPendingRecords,
        myTotalContributions,
        myUpcomingPrograms,
        myZakatCalculations: myZakatCalculations || 0,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load member dashboard data'
      );
      console.error('Error loading member dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [isMember, user?.email, profile?.id]);

  // Load recent activities
  const loadRecentActivities = useCallback(async () => {
    try {
      const activities: DashboardActivity[] = [];

      if (isAdmin) {
        // Admin sees all activities
        // Recent khairat records
        const { data: recentKhairat } = await supabase
          .from('khairat_records')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false })
          .limit(3);

        recentKhairat?.forEach((record) => {
          activities.push({
            id: `khairat-${record.id}`,
            type: 'khairat',
            message: `Khairat record submitted by ${
              record.profiles?.full_name || record.member_name || 'Unknown'
            } - RM ${record.contribution_amount}`,
            time: getTimeAgo(new Date(record.created_at)),
            timestamp: new Date(record.created_at),
          });
        });

        // Recent member registrations
        const { data: recentMembers } = await supabase
          .from('profiles')
          .select('full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(2);

        recentMembers?.forEach((member) => {
          activities.push({
            id: `member-${member.full_name}-${member.created_at}`,
            type: 'member',
            message: `New member registered: ${member.full_name}`,
            time: getTimeAgo(new Date(member.created_at)),
            timestamp: new Date(member.created_at),
          });
        });
      } else if (isMember && user?.email) {
        // Member sees only their activities
        const { data: myKhairat } = await supabase
          .from('khairat_records')
          .select('*')
          .eq('member_email', user.email)
          .order('created_at', { ascending: false })
          .limit(3);

        myKhairat?.forEach((record) => {
          activities.push({
            id: `my-khairat-${record.id}`,
            type: 'khairat',
            message: `Your khairat contribution of RM ${record.contribution_amount} is ${record.status}`,
            time: getTimeAgo(new Date(record.created_at)),
            timestamp: new Date(record.created_at),
          });
        });

        // User's program registrations
        const { data: myPrograms } = await supabase
          .from('program_registrations')
          .select('*, programs(title)')
          .eq('member_email', user.email)
          .order('created_at', { ascending: false })
          .limit(2);

        myPrograms?.forEach((registration) => {
          activities.push({
            id: `my-program-${registration.id}`,
            type: 'program',
            message: `You registered for ${
              registration.programs?.title || 'a program'
            }`,
            time: getTimeAgo(new Date(registration.created_at)),
            timestamp: new Date(registration.created_at),
          });
        });
      }

      // Sort activities by timestamp
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setRecentActivities(activities.slice(0, 5));
    } catch (err) {
      console.error('Error loading recent activities:', err);
    }
  }, [isAdmin, isMember, user?.email]);

  // Load data based on user role
  useEffect(() => {
    if (isAdmin) {
      loadAdminStats();
    } else if (isMember) {
      loadMemberStats();
    }
    loadRecentActivities();
  }, [
    isAdmin,
    isMember,
    loadAdminStats,
    loadMemberStats,
    loadRecentActivities,
  ]);

  // Refresh functions
  const refreshData = useCallback(() => {
    if (isAdmin) {
      loadAdminStats();
    } else if (isMember) {
      loadMemberStats();
    }
    loadRecentActivities();
  }, [
    isAdmin,
    isMember,
    loadAdminStats,
    loadMemberStats,
    loadRecentActivities,
  ]);

  return {
    adminStats,
    memberStats,
    recentActivities,
    loading,
    error,
    isAdmin,
    isMember,
    refreshData,
  };
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}
