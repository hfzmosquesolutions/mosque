'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Target,
  Loader2,
  Edit,
  Eye,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getContributionPrograms,
  createContributionProgram,
  getUserMosqueId,
} from '@/lib/api';
import type { ContributionProgram, ProgramType } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProgramManagementProps {
  onProgramSelect?: (program: ContributionProgram) => void;
  onProgramsUpdate?: () => void;
  filterType?: ProgramType;
  isCreateDialogOpen?: boolean;
  onCreateDialogOpenChange?: (open: boolean) => void;
}

export function ProgramManagement({
  onProgramSelect,
  onProgramsUpdate,
  filterType,
  isCreateDialogOpen: externalIsCreateDialogOpen,
  onCreateDialogOpenChange,
}: ProgramManagementProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<ContributionProgram[]>([]);
  const [internalIsCreateDialogOpen, setInternalIsCreateDialogOpen] =
    useState(false);

  // Use external state if provided, otherwise use internal state
  const isCreateDialogOpen =
    externalIsCreateDialogOpen ?? internalIsCreateDialogOpen;
  const setIsCreateDialogOpen = (open: boolean) => {
    if (onCreateDialogOpenChange) {
      onCreateDialogOpenChange(open);
    } else {
      setInternalIsCreateDialogOpen(open);
    }
  };
  const [submitting, setSubmitting] = useState(false);
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] =
    useState<ContributionProgram | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [programType, setProgramType] = useState<ProgramType>(
    filterType ?? 'khairat'
  );

  // Keep local programType in sync if parent constrains filterType
  useEffect(() => {
    setProgramType(filterType ?? 'khairat');
  }, [filterType]);

  const PROGRAM_TYPES: ProgramType[] = [
    'khairat',
    'zakat',
    'infaq',
    'sadaqah',
    'general',
    'education',
    'maintenance',
  ];
  const loadUserMosque = async () => {
    if (!user) return;

    try {
      const userMosqueId = await getUserMosqueId(user.id);
      setMosqueId(userMosqueId);
      // If user has no mosque, stop loading to avoid infinite spinner
      if (!userMosqueId) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading user mosque:', error);
      toast.error('Failed to load mosque information');
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    if (!mosqueId) return;

    setLoading(true);
    try {
      const response = await getContributionPrograms(mosqueId, filterType);
      if (response.success && response.data) {
        setPrograms(response.data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Failed to load contribution programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserMosque();
    }
  }, [user]);

  useEffect(() => {
    if (mosqueId) {
      loadPrograms();
    }
  }, [mosqueId]);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !mosqueId || !name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const programData = {
        mosque_id: mosqueId,
        name,
        description: description || undefined,
        target_amount: targetAmount ? parseFloat(targetAmount) : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        is_active: true,
        created_by: user.id,
        program_type: programType,
      };

      const response = await createContributionProgram(programData);

      if (response.success) {
        toast.success('Contribution program created successfully!');
        setIsCreateDialogOpen(false);
        resetForm();
        loadPrograms();
        onProgramsUpdate?.();
      } else {
        toast.error(response.error || 'Failed to create program');
      }
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error('Failed to create program');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setTargetAmount('');
    setStartDate('');
    setEndDate('');
  };

  const calculateProgress = (current: number, target?: number) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
    }).format(amount);
  };

  const columns: ColumnDef<ContributionProgram>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Program" />
      ),
      cell: ({ row }) => {
        const program = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">
              {program.name}
            </div>
            {program.description && (
              <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">
                {program.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const program = row.original;
        const isActive = program.is_active;
        const hasEnded =
          program.end_date && new Date(program.end_date) < new Date();
        return (
          <Badge variant={isActive && !hasEnded ? 'default' : 'secondary'}>
            {hasEnded ? 'Ended' : isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'progress',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Progress" />
      ),
      cell: ({ row }) => {
        const program = row.original;
        const progress = calculateProgress(
          program.current_amount,
          program.target_amount
        );
        return (
          <div className="space-y-2 min-w-[120px]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                {program.target_amount ? (
                  `${progress.toFixed(1)}%`
                ) : (
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    No Target
                  </span>
                )}
              </span>
              <span className="font-medium text-emerald-600">
                {formatCurrency(program.current_amount)}
              </span>
            </div>
            {program.target_amount ? (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            ) : (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Ongoing contributions
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const program = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedProgram(program);
                setIsModalOpen(true);
              }}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Program
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading programs...</span>
      </div>
    );
  }

  if (!mosqueId) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Mosque Found</h3>
          <p className="text-muted-foreground mb-4">
            To manage contribution programs, please create your mosque profile
            first.
          </p>
          <Button asChild>
            <Link href="mosque-profile">Go to Mosque Profile</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Program Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Program Details
            </DialogTitle>
          </DialogHeader>

          {selectedProgram && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Program Name
                  </Label>
                  <p className="text-sm font-medium">{selectedProgram.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Status
                  </Label>
                  <Badge
                    variant={
                      selectedProgram.is_active ? 'default' : 'secondary'
                    }
                  >
                    {selectedProgram.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              {selectedProgram.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Description
                  </Label>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                    {selectedProgram.description}
                  </p>
                </div>
              )}

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Current Amount
                  </Label>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedProgram.current_amount || 0)}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Target Amount
                  </Label>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                    {selectedProgram.target_amount ? (
                      formatCurrency(selectedProgram.target_amount)
                    ) : (
                      <span className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        No target set
                      </span>
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Progress
                  </Label>
                  <div className="space-y-2">
                    {selectedProgram.target_amount ? (
                      <>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {Math.min(
                            ((selectedProgram.current_amount || 0) /
                              selectedProgram.target_amount) *
                              100,
                            100
                          ).toFixed(1)}
                          %
                        </p>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                ((selectedProgram.current_amount || 0) /
                                  selectedProgram.target_amount) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-2">
                        <span className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">
                          Ongoing contributions
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          No target amount set
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Start Date
                  </Label>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedProgram.start_date
                      ? new Date(selectedProgram.start_date).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )
                      : 'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    End Date
                  </Label>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {selectedProgram.end_date
                      ? new Date(selectedProgram.end_date).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )
                      : 'No end date set'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button className="gap-2" onClick={() => setIsModalOpen(false)}>
                  <Edit className="h-4 w-4" />
                  Edit Program
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onProgramSelect?.(selectedProgram)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Contributions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          {/* <div>
            <h2 className="text-2xl font-bold">Contribution Programs</h2>
            <p className="text-muted-foreground">
              Manage your mosque&apos;s contribution programs and track
              contributions
            </p>
          </div> */}

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              {/* <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Program
              </Button> */}
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Contribution Program</DialogTitle>
                <DialogDescription>
                  Create a new contribution program for your mosque community
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateProgram} className="space-y-4">
                {!filterType && (
                  <div className="space-y-2">
                    <Label htmlFor="programType">Program Type</Label>
                    <Select
                      value={programType}
                      onValueChange={(val) =>
                        setProgramType(val as ProgramType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select program type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROGRAM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Choose the program type for this new contribution program.
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Program Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Monthly Khairat, Emergency Fund"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the purpose of this program..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Target Amount (RM)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Leave empty for no target amount"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Set a target amount for this program. Leave empty
                    for ongoing contributions without a specific goal.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || !name}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Program'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* {programs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Programs Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first contribution program to start collecting
                contributions
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <DataTable
                  columns={columns}
                  data={programs}
                  searchKey="name"
                  searchPlaceholder="Search programs..."
                />
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>
    </>
  );
}
