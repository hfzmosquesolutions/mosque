'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Calendar,
  User,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { UserDependent } from '@/types/database';

interface DependentsTableProps {
  dependents: UserDependent[];
  onEdit: (dependent: UserDependent) => void;
  onDelete: (dependentId: string) => void;
}

export function DependentsTable({ dependents, onEdit, onDelete }: DependentsTableProps) {
  const t = useTranslations('dependents');
  const [selectedDependent, setSelectedDependent] = useState<UserDependent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getRelationshipBadge = (relationship: string) => {
    const relationshipConfig = {
      spouse: { label: t('spouse'), variant: 'default' as const },
      child: { label: t('child'), variant: 'secondary' as const },
      parent: { label: t('parent'), variant: 'outline' as const },
      sibling: { label: t('sibling'), variant: 'secondary' as const },
      other: { label: t('other'), variant: 'outline' as const },
    };

    const config = relationshipConfig[relationship.toLowerCase() as keyof typeof relationshipConfig] || relationshipConfig.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetails = (dependent: UserDependent) => {
    setSelectedDependent(dependent);
    setIsModalOpen(true);
  };

  const handleEdit = (dependent: UserDependent) => {
    onEdit(dependent);
  };

  const handleDelete = (dependentId: string) => {
    if (confirm(t('confirmDeleteDependent'))) {
      onDelete(dependentId);
    }
  };

  const columns: ColumnDef<UserDependent>[] = [
    {
      accessorKey: 'full_name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('name')} />
      ),
      cell: ({ row }) => {
        const dependent = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {dependent.full_name}
              {dependent.emergency_contact && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {dependent.gender && (
                <span className="capitalize">{dependent.gender}</span>
              )}
              {dependent.date_of_birth && dependent.gender && ' • '}
              {dependent.date_of_birth && (
                <span>{calculateAge(dependent.date_of_birth)} years old</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'relationship',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('relationship')} />
      ),
      cell: ({ row }) => {
        return getRelationshipBadge(row.getValue('relationship'));
      },
    },
    {
      accessorKey: 'date_of_birth',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('dateOfBirth')} />
      ),
      cell: ({ row }) => {
        const dateOfBirth = row.getValue('date_of_birth') as string;
        return dateOfBirth ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(dateOfBirth)}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t('notSpecified')}</span>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('contact')} />
      ),
      cell: ({ row }) => {
        const dependent = row.original;
        return (
          <div className="space-y-1">
            {dependent.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{dependent.phone}</span>
              </div>
            )}
            {dependent.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="truncate max-w-[150px]">{dependent.email}</span>
              </div>
            )}
            {!dependent.phone && !dependent.email && (
              <span className="text-sm text-muted-foreground">{t('noContactInfo')}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'emergency_contact',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('emergency')} />
      ),
      cell: ({ row }) => {
        const isEmergencyContact = row.getValue('emergency_contact') as boolean;
        return isEmergencyContact ? (
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <Badge variant="destructive" className="text-xs">
              {t('emergency')}
            </Badge>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No</span>
        );
      },
    },
    {
      id: 'actions',
      header: t('actions'),
      cell: ({ row }) => {
        const dependent = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(dependent)}
              className="h-8 px-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(dependent)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(dependent.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Mobile Card Component
  const MobileDependentCard = ({ dependent }: { dependent: UserDependent }) => (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Name and Emergency Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {dependent.full_name}
                </h3>
                {dependent.emergency_contact && (
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {getRelationshipBadge(dependent.relationship)}
                {dependent.emergency_contact && (
                  <Badge variant="destructive" className="text-xs">
                    {t('emergency')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-2">
            {dependent.date_of_birth && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(dependent.date_of_birth)} ({calculateAge(dependent.date_of_birth)} years old)</span>
              </div>
            )}
            {dependent.gender && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="capitalize">{dependent.gender}</span>
              </div>
            )}
          </div>

          {/* Contact Info */}
          {(dependent.phone || dependent.email) && (
            <div className="space-y-1">
              {dependent.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{dependent.phone}</span>
                </div>
              )}
              {dependent.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{dependent.email}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewDetails(dependent)}
              className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('view')}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(dependent)}
                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(dependent.id)}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Dependents Table */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            {t('dependentsList')}
          </CardTitle>
          <CardDescription>
            {t('manageInformation')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dependents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('noDependentsYet')}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t('addDependentsDescription')}
              </p>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {dependents.map((dependent) => (
                <MobileDependentCard key={dependent.id} dependent={dependent} />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={dependents} />
          )}
        </CardContent>
      </Card>

      {/* Dependent Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              {t('dependentDetails')}
            </DialogTitle>
            <DialogDescription>
              {t('completeInformation')}
            </DialogDescription>
          </DialogHeader>
          {selectedDependent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('fullName')}
                  </h4>
                  <p className="font-semibold">{selectedDependent.full_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('relationship')}
                  </h4>
                  <div>{getRelationshipBadge(selectedDependent.relationship)}</div>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('dateOfBirth')}
                  </h4>
                  <p className="font-semibold">
                    {selectedDependent.date_of_birth
                      ? `${formatDate(selectedDependent.date_of_birth)} (${calculateAge(selectedDependent.date_of_birth)} ${t('yearsOld')})`
                      : t('notSpecified')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('gender')}
                  </h4>
                  <p className="font-semibold capitalize">
                    {selectedDependent.gender || t('notSpecified')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('phone')}
                  </h4>
                  <p className="font-semibold">
                    {selectedDependent.phone || t('notProvided')}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('email')}
                  </h4>
                  <p className="font-semibold">
                    {selectedDependent.email || t('notProvided')}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">
                  {t('emergencyContact')}
                </h4>
                <div className="flex items-center gap-2">
                  {selectedDependent.emergency_contact ? (
                    <>
                      <Heart className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive">{t('yes')}</Badge>
                    </>
                  ) : (
                    <Badge variant="outline">{t('no')}</Badge>
                  )}
                </div>
              </div>
              {selectedDependent.address && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('address')}
                  </h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {selectedDependent.address}
                  </p>
                </div>
              )}
              {selectedDependent.notes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    {t('notes')}
                  </h4>
                  <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded">
                    {selectedDependent.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}