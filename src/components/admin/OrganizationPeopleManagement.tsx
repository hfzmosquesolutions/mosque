'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Users, 
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { ImageUpload } from '@/components/ui/image-upload';
import { supabase } from '@/lib/supabase';
import { 
  OrganizationPerson, 
  CreateOrganizationPerson, 
  UpdateOrganizationPerson,
  getOrganizationPeople,
  createOrganizationPerson,
  updateOrganizationPerson,
  deleteOrganizationPerson
} from '@/lib/api';

interface OrganizationPeopleManagementProps {
  mosqueId: string;
}

const POSITION_OPTIONS = [
  'Imam',
  'Deputy Imam',
  'Board Member',
  'President',
  'Vice President',
  'Secretary',
  'Treasurer',
  'Volunteer Coordinator',
  'Activities Coordinator',
  'Education Coordinator',
  'Youth Coordinator',
  'Women\'s Coordinator',
  'Maintenance Staff',
  'Security Staff',
  'Other'
];

const DEPARTMENT_OPTIONS = [
  'Administration',
  'Finance',
  'Education',
  'Activities',
  'Youth',
  'Women\'s Affairs',
  'Maintenance',
  'Security',
  'Volunteer Services',
  'Other'
];

export function OrganizationPeopleManagement({ mosqueId }: OrganizationPeopleManagementProps) {
  const t = useTranslations('mosquePage.organizationPeople');
  const [people, setPeople] = useState<OrganizationPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<OrganizationPerson | null>(null);
  const [formData, setFormData] = useState<CreateOrganizationPerson>({
    mosque_id: mosqueId,
    full_name: '',
    position: '',
    department: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    profile_picture_url: '',
    is_public: true,
    start_date: '',
    end_date: ''
  });

  const getPositionOptions = () => [
    t('positions.imam'),
    t('positions.deputyImam'),
    t('positions.boardMember'),
    t('positions.president'),
    t('positions.vicePresident'),
    t('positions.secretary'),
    t('positions.treasurer'),
    t('positions.volunteerCoordinator'),
    t('positions.activitiesCoordinator'),
    t('positions.educationCoordinator'),
    t('positions.youthCoordinator'),
    t('positions.womensCoordinator'),
    t('positions.maintenanceStaff'),
    t('positions.securityStaff'),
    t('positions.other')
  ];

  const getDepartmentOptions = () => [
    t('departments.administration'),
    t('departments.finance'),
    t('departments.education'),
    t('departments.activities'),
    t('departments.youth'),
    t('departments.womensAffairs'),
    t('departments.maintenance'),
    t('departments.security'),
    t('departments.volunteerServices'),
    t('departments.other')
  ];

  useEffect(() => {
    fetchPeople();
  }, [mosqueId]);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      const response = await getOrganizationPeople(mosqueId);
      if (response.success && response.data) {
        setPeople(response.data);
      } else {
        toast.error(response.error || t('failedToFetch'));
      }
    } catch (error) {
      console.error('Error fetching people:', error);
      toast.error(t('failedToFetch'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.full_name.trim() || !formData.position.trim()) {
        toast.error(t('fullNameAndPositionRequired'));
        return;
      }

      const response = await createOrganizationPerson(formData);
      if (response.success) {
        toast.success(t('personAdded'));
        setIsCreateDialogOpen(false);
        resetForm();
        fetchPeople();
      } else {
        toast.error(response.error || t('failedToCreate'));
      }
    } catch (error) {
      console.error('Error creating person:', error);
      toast.error(t('failedToCreate'));
    }
  };

  const handleEdit = (person: OrganizationPerson) => {
    setEditingPerson(person);
    setFormData({
      mosque_id: person.mosque_id,
      full_name: person.full_name,
      position: person.position,
      department: person.department || '',
      email: person.email || '',
      phone: person.phone || '',
      address: person.address || '',
      bio: person.bio || '',
      profile_picture_url: person.profile_picture_url || '',
      is_public: person.is_public,
      start_date: person.start_date || '',
      end_date: person.end_date || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingPerson) return;

    try {
      if (!formData.full_name.trim() || !formData.position.trim()) {
        toast.error(t('fullNameAndPositionRequired'));
        return;
      }

      const updateData: UpdateOrganizationPerson = {
        full_name: formData.full_name,
        position: formData.position,
        department: formData.department || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        bio: formData.bio || undefined,
        profile_picture_url: formData.profile_picture_url || undefined,
        is_public: formData.is_public,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined
      };

      const response = await updateOrganizationPerson(editingPerson.id, updateData);
      if (response.success) {
        toast.success(t('personUpdated'));
        setIsEditDialogOpen(false);
        setEditingPerson(null);
        resetForm();
        fetchPeople();
      } else {
        toast.error(response.error || t('failedToUpdate'));
      }
    } catch (error) {
      console.error('Error updating person:', error);
      toast.error(t('failedToUpdate'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await deleteOrganizationPerson(id);
      if (response.success) {
        toast.success(t('personDeleted'));
        fetchPeople();
      } else {
        toast.error(response.error || t('failedToDelete'));
      }
    } catch (error) {
      console.error('Error deleting person:', error);
      toast.error(t('failedToDelete'));
    }
  };

  const resetForm = () => {
    setFormData({
      mosque_id: mosqueId,
      full_name: '',
      position: '',
      department: '',
      email: '',
      phone: '',
      address: '',
      bio: '',
      profile_picture_url: '',
      is_public: true,
      start_date: '',
      end_date: ''
    });
  };

  const handleCreateDialogClose = (open: boolean) => {
    if (!open) {
      // Dialog is being closed, clean up any uploaded image if form wasn't submitted
      if (formData.profile_picture_url) {
        // Delete the uploaded image from storage since it wasn't used
        const deleteUnusedImage = async () => {
          try {
            if (formData.profile_picture_url) {
              const url = new URL(formData.profile_picture_url);
              const pathParts = url.pathname.split('/');
              const mosqueImagesIndex = pathParts.findIndex(part => part === 'mosque-images');
              if (mosqueImagesIndex !== -1 && mosqueImagesIndex < pathParts.length - 1) {
                const filePath = pathParts.slice(mosqueImagesIndex + 1).join('/');
                await supabase.storage.from('mosque-images').remove([filePath]);
                console.log('Unused image deleted from storage');
              }
            }
          } catch (error) {
            console.error('Error deleting unused image:', error);
          }
        };
        deleteUnusedImage();
      }
      resetForm();
    }
    setIsCreateDialogOpen(open);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isActive = (person: OrganizationPerson) => {
    if (!person.is_active) return false;
    if (person.end_date) {
      return new Date(person.end_date) > new Date();
    }
    return true;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <div className="text-center py-8">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={handleCreateDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addPerson')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('addOrganizationPerson')}</DialogTitle>
                <DialogDescription>
                  {t('addOrganizationPersonDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t('fullNameRequired')}</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder={t('fullNamePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">{t('positionRequired')}</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectPosition')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getPositionOptions().map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">{t('department')}</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectDepartment')} />
                    </SelectTrigger>
                    <SelectContent>
                      {getDepartmentOptions().map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('phonePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">{t('startDate')}</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">{t('endDate')}</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder={t('addressPlaceholder')}
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="bio">{t('bio')}</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={t('bioPlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <ImageUpload
                    label={t('profilePicture')}
                    description={t('profilePictureDescription')}
                    currentImageUrl={formData.profile_picture_url || null}
                    onImageUpload={(url) => setFormData({ ...formData, profile_picture_url: url })}
                    onImageRemove={() => setFormData({ ...formData, profile_picture_url: '' })}
                    onImageChange={async (url) => {
                      // This will be called when image is removed or uploaded via the ImageUpload component
                      // During create mode, just update form data without database update
                      if (url === null) {
                        setFormData({ ...formData, profile_picture_url: '' });
                      } else if (url) {
                        setFormData({ ...formData, profile_picture_url: url });
                      }
                    }}
                    aspectRatio="square"
                    filePrefix="person"
                    maxSizeInMB={5}
                  />
                </div>
                <div className="md:col-span-2 flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                  <Label htmlFor="is_public">{t('showInPublicPage')}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleCreate}>{t('addPerson')}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {people.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noPeopleYet')}</p>
            <p className="text-sm">{t('clickToGetStarted')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">{t('photo')}</TableHead>
                  <TableHead>{t('name')}</TableHead>
                  <TableHead>{t('position')}</TableHead>
                  <TableHead>{t('department')}</TableHead>
                  <TableHead>{t('contact')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead>{t('visibility')}</TableHead>
                  <TableHead className="w-[50px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {people.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                        {person.profile_picture_url ? (
                          <img
                            src={person.profile_picture_url}
                            alt={person.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{person.full_name}</div>
                        {person.bio && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {person.bio}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{person.position}</Badge>
                    </TableCell>
                    <TableCell>
                      {person.department && (
                        <Badge variant="outline">{person.department}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {person.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{person.email}</span>
                          </div>
                        )}
                        {person.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{person.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive(person) ? 'default' : 'secondary'}>
                        {isActive(person) ? t('active') : t('inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {person.is_public ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">
                          {person.is_public ? t('public') : t('private')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(person)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('delete')}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('deletePerson')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('deletePersonDescription')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(person.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t('delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('editOrganizationPerson')}</DialogTitle>
              <DialogDescription>
                {t('addOrganizationPersonDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">{t('fullNameRequired')}</Label>
                <Input
                  id="edit_full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder={t('fullNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_position">{t('positionRequired')}</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectPosition')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getPositionOptions().map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_department">{t('department')}</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectDepartment')} />
                  </SelectTrigger>
                  <SelectContent>
                    {getDepartmentOptions().map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_email">{t('email')}</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('emailPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">{t('phone')}</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Start Date</Label>
                <Input
                  id="edit_start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_end_date">End Date (Optional)</Label>
                <Input
                  id="edit_end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit_address">Address</Label>
                <Textarea
                  id="edit_address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  rows={2}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="edit_bio">Bio</Label>
                <Textarea
                  id="edit_bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Enter bio or description"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <ImageUpload
                  label="Profile Picture"
                  description="Upload a profile picture for this organization person"
                  currentImageUrl={formData.profile_picture_url || null}
                  onImageUpload={(url) => setFormData({ ...formData, profile_picture_url: url })}
                  onImageRemove={() => setFormData({ ...formData, profile_picture_url: '' })}
                  onImageChange={async (url) => {
                    // This will be called when image is removed or replaced via the ImageUpload component
                    // Only update database during edit mode, not during create mode
                    if (editingPerson) {
                      if (url === null) {
                        // Image removed
                        setFormData({ ...formData, profile_picture_url: '' });
                        
                        try {
                          const response = await updateOrganizationPerson(editingPerson.id, {
                            profile_picture_url: ''
                          });
                          
                          if (response.success) {
                            toast.success('Profile picture removed successfully');
                            fetchPeople(); // Refresh the list
                          } else {
                            toast.error(response.error || 'Failed to remove profile picture');
                          }
                        } catch (error) {
                          console.error('Error removing profile picture:', error);
                          toast.error('Failed to remove profile picture');
                        }
                      } else if (url) {
                        // Image replaced
                        setFormData({ ...formData, profile_picture_url: url });
                        
                        try {
                          const response = await updateOrganizationPerson(editingPerson.id, {
                            profile_picture_url: url
                          });
                          
                          if (response.success) {
                            toast.success('Profile picture updated successfully');
                            fetchPeople(); // Refresh the list
                          } else {
                            toast.error(response.error || 'Failed to update profile picture');
                          }
                        } catch (error) {
                          console.error('Error updating profile picture:', error);
                          toast.error('Failed to update profile picture');
                        }
                      }
                    } else {
                      // During create mode, just update form data without database update
                      if (url === null) {
                        setFormData({ ...formData, profile_picture_url: '' });
                      } else if (url) {
                        setFormData({ ...formData, profile_picture_url: url });
                      }
                    }
                  }}
                  aspectRatio="square"
                  filePrefix="person"
                  maxSizeInMB={5}
                />
              </div>
              <div className="md:col-span-2 flex items-center space-x-2">
                <Switch
                  id="edit_is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
                  <Label htmlFor="edit_is_public">{t('showInPublicPage')}</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleUpdate}>{t('updatePerson')}</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
