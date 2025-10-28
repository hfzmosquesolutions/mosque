'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard, StatsCardColors } from '@/components/ui/stats-card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Users,
  Heart,
  HeartHandshake,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';
import { getKhairatMembers } from '@/lib/api/khairat-members';
import { KhairatMember } from '@/types/database';

// Filter to only show membership statuses (not application statuses)
type KhairatMembership = KhairatMember & {
  status: 'active' | 'inactive' | 'suspended';
};

interface MembershipStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}

interface KhairatMembershipManagementProps {
  mosqueId: string;
}

export function KhairatMembershipManagement({
  mosqueId,
}: KhairatMembershipManagementProps) {
  const { user } = useAuth();
  const t = useTranslations('khairatManagement');
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<KhairatMembership[]>([]);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const loadMemberships = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const members = await getKhairatMembers({
        mosque_id: mosqueId,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      // Filter to only show membership statuses
      const memberships = members.filter(member => 
        ['active', 'inactive', 'suspended'].includes(member.status)
      ) as KhairatMembership[];
      
      setMemberships(memberships);

      // Calculate stats
      const total = memberships.length;
      const active = memberships.filter(m => m.status === 'active').length;
      const inactive = memberships.filter(m => m.status === 'inactive').length;
      const suspended = memberships.filter(m => m.status === 'suspended').length;

      setStats({
        total,
        active,
        inactive,
        suspended,
      });
    } catch (error) {
      console.error('Error loading khairat memberships:', error);
      toast.error('Failed to load memberships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemberships();
  }, [mosqueId, page, statusFilter, searchTerm]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      inactive: { label: 'Inactive', variant: 'secondary' as const, icon: UserX },
      suspended: { label: 'Suspended', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const columns: ColumnDef<KhairatMembership>[] = [
    {
      accessorKey: 'user.full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Member" />
      ),
      cell: ({ row }) => {
        const membership = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{membership.user?.full_name || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">
              {membership.user?.phone || 'No contact info'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'mosque.name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Mosque" />
      ),
      cell: ({ row }) => {
        const membership = row.original;
        return (
          <div className="text-sm">
            {membership.mosque?.name || 'Unknown Mosque'}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'joined_date',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('joined_date') as string;
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Updated" />
      ),
      cell: ({ row }) => {
        const date = row.getValue('created_at') as string;
        return (
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const membership = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <UserCheck className="h-4 w-4" />
            </Button>
            {membership.status === 'active' && (
              <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                <UserX className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm text-muted-foreground">Loading memberships...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Members"
            value={stats.total.toString()}
            icon={Users}
            {...StatsCardColors.blue}
          />
          <StatsCard
            title="Active Members"
            value={stats.active.toString()}
            icon={CheckCircle}
            {...StatsCardColors.emerald}
          />
          <StatsCard
            title="Inactive Members"
            value={stats.inactive.toString()}
            icon={UserX}
            {...StatsCardColors.orange}
          />
          <StatsCard
            title="Suspended Members"
            value={stats.suspended.toString()}
            icon={XCircle}
            {...StatsCardColors.red}
          />
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Memberships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Memberships Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Khairat Memberships
          </CardTitle>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <div className="text-center py-8">
              <HeartHandshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No memberships found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No khairat memberships have been created yet'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={memberships}
              searchKey="user.full_name"
              searchPlaceholder="Search memberships..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
