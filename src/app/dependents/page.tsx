'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  UserPlus,
  Heart,
} from 'lucide-react';
import { DependentsTable } from '@/components/dependents/DependentsTable';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserDependents,
  createUserDependent,
  updateUserDependent,
  deleteUserDependent,
} from '@/lib/api';
import { UserDependent, CreateUserDependent } from '@/types/database';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function DependentsContent() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const router = useRouter();

  const [dependents, setDependents] = useState<UserDependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDependent, setEditingDependent] =
    useState<UserDependent | null>(null);
  const [dependentForm, setDependentForm] = useState<CreateUserDependent>({
    user_id: '',
    full_name: '',
    relationship: '',
    date_of_birth: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    emergency_contact: false,
    notes: '',
  });

  // Redirect admin users away from this page
  useEffect(() => {
    if (isAdmin) {
      router.push('/dashboard');
      toast.error('This feature is only available for regular users.');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    async function fetchDependents() {
      if (!user?.id || isAdmin) return;

      setLoading(true);
      setError(null);

      try {
        const dependentsRes = await getUserDependents(user.id);
        if (dependentsRes.success) {
          setDependents(dependentsRes.data || []);
        } else {
          throw new Error(dependentsRes.error || 'Failed to load dependents');
        }

        // Initialize dependent form with user_id
        setDependentForm((prev) => ({ ...prev, user_id: user.id }));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dependents');
      } finally {
        setLoading(false);
      }
    }

    fetchDependents();
  }, [user?.id, isAdmin]);

  const updateDependentForm = (
    field: keyof CreateUserDependent,
    value: any
  ) => {
    setDependentForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetDependentForm = () => {
    setDependentForm({
      user_id: user?.id || '',
      full_name: '',
      relationship: '',
      date_of_birth: '',
      gender: 'male',
      phone: '',
      email: '',
      address: '',
      emergency_contact: false,
      notes: '',
    });
  };

  const handleAddDependent = () => {
    resetDependentForm();
    setEditingDependent(null);
    setDialogOpen(true);
    setError('');
  };

  const handleEditDependent = (dependent: UserDependent) => {
    setDependentForm({
      user_id: dependent.user_id,
      full_name: dependent.full_name,
      relationship: dependent.relationship,
      date_of_birth: dependent.date_of_birth || '',
      gender: dependent.gender || 'male',
      phone: dependent.phone || '',
      email: dependent.email || '',
      address: dependent.address || '',
      emergency_contact: dependent.emergency_contact || false,
      notes: dependent.notes || '',
    });
    setEditingDependent(dependent);
    setDialogOpen(true);
    setError('');
  };

  const handleSaveDependent = async () => {
    if (!dependentForm.full_name || !dependentForm.relationship) {
      setError('Full name and relationship are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingDependent) {
        const result = await updateUserDependent(
          editingDependent.id,
          dependentForm
        );
        if (!result.success) {
          throw new Error(result.error || 'Failed to update dependent');
        }
        setDependents((prev) =>
          prev.map((d) => (d.id === editingDependent.id ? result.data! : d))
        );
        toast.success('Dependent updated successfully!');
      } else {
        const result = await createUserDependent(dependentForm);
        if (!result.success) {
          throw new Error(result.error || 'Failed to add dependent');
        }
        setDependents((prev) => [...prev, result.data!]);
        toast.success('Dependent added successfully!');
      }

      setDialogOpen(false);
      setEditingDependent(null);
      resetDependentForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save dependent');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDependent = async (dependentId: string) => {
    if (!confirm('Are you sure you want to delete this dependent?')) {
      return;
    }

    try {
      const result = await deleteUserDependent(dependentId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete dependent');
      }

      setDependents((prev) => prev.filter((d) => d.id !== dependentId));
      toast.success('Dependent deleted successfully!');
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Failed to delete dependent'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isAdmin) {
    return null; // This will be handled by the redirect in useEffect
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dependents</h1>
            <p className="text-gray-600">
              Manage your family members and dependents
            </p>
          </div>
        </div>
        <Button
          onClick={handleAddDependent}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Dependent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Dependents</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dependents.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Contacts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dependents.filter((d) => d.emergency_contact).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-100 rounded-lg">
                <Heart className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Family Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    dependents.filter((d) =>
                      ['spouse', 'child', 'parent', 'sibling'].includes(
                        d.relationship.toLowerCase()
                      )
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <DependentsTable
        dependents={dependents}
        onEdit={handleEditDependent}
        onDelete={handleDeleteDependent}
      />

      {/* Dependent Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingDependent(null);
            setError('');
            resetDependentForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDependent ? 'Edit Dependent' : 'Add New Dependent'}
            </DialogTitle>
            <DialogDescription>
              {editingDependent
                ? 'Update the information for this dependent.'
                : 'Add a new dependent to your profile.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="dependentName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dependentName"
                value={dependentForm.full_name}
                onChange={(e) =>
                  updateDependentForm('full_name', e.target.value)
                }
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependentRelationship">
                Relationship <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dependentRelationship"
                value={dependentForm.relationship}
                onChange={(e) =>
                  updateDependentForm('relationship', e.target.value)
                }
                placeholder="e.g. Spouse, Child, Parent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependentDob">Date of Birth</Label>
              <Input
                id="dependentDob"
                type="date"
                value={dependentForm.date_of_birth}
                onChange={(e) =>
                  updateDependentForm('date_of_birth', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependentGender">Gender</Label>
              <Select
                value={dependentForm.gender}
                onValueChange={(val) => updateDependentForm('gender', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependentPhone">Phone</Label>
              <Input
                id="dependentPhone"
                type="tel"
                value={dependentForm.phone}
                onChange={(e) => updateDependentForm('phone', e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dependentEmail">Email</Label>
              <Input
                id="dependentEmail"
                type="email"
                value={dependentForm.email}
                onChange={(e) => updateDependentForm('email', e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dependentAddress">Address</Label>
              <Textarea
                id="dependentAddress"
                value={dependentForm.address}
                onChange={(e) => updateDependentForm('address', e.target.value)}
                placeholder="Full address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Select
                value={dependentForm.emergency_contact ? 'yes' : 'no'}
                onValueChange={(val) =>
                  updateDependentForm('emergency_contact', val === 'yes')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Is emergency contact?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dependentNotes">Notes</Label>
              <Textarea
                id="dependentNotes"
                value={dependentForm.notes}
                onChange={(e) => updateDependentForm('notes', e.target.value)}
                placeholder="Additional notes or information"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingDependent(null);
                setError('');
                resetDependentForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDependent}
              disabled={
                !dependentForm.full_name ||
                !dependentForm.relationship ||
                saving
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                  Saving...
                </>
              ) : (
                <>{editingDependent ? 'Update' : 'Add'} Dependent</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DependentsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DependentsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
