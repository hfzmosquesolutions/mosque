'use client';

import { useState } from 'react';
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
import { DialogFooter } from '@/components/ui/dialog';
import { updateKhairatProgram, deleteKhairatProgram } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { KhairatProgram } from '@/types/database';

interface EditProgramFormProps {
  program: KhairatProgram;
  onCancel: () => void;
  onSuccess: () => void;
}

export function EditProgramForm({
  program,
  onSuccess,
  onCancel,
}: EditProgramFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: program.name,
    description: program.description || '',
    target_amount: program.target_amount?.toString() || '',
    start_date: program.start_date
      ? new Date(program.start_date).toISOString().split('T')[0]
      : '',
    end_date: program.end_date
      ? new Date(program.end_date).toISOString().split('T')[0]
      : '',
    is_active: program.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Program name is required');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        target_amount: formData.target_amount
          ? parseFloat(formData.target_amount)
          : undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        is_active: formData.is_active,
      };

      const result = await updateKhairatProgram(program.id, updateData);
      toast.success('Program updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating khairat program:', error);
      toast.error('Failed to update khairat program');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Program type removed for dedicated khairat programs */}

      <div className="space-y-2">
        <Label htmlFor="name">Program Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          placeholder="Enter program name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          placeholder="Enter program description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_amount">Target Amount (RM)</Label>
        <Input
          id="target_amount"
          type="number"
          step="0.01"
          min="0"
          value={formData.target_amount}
          onChange={(e) => updateFormData('target_amount', e.target.value)}
          placeholder="Enter target amount (optional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => updateFormData('start_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => updateFormData('end_date', e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => updateFormData('is_active', e.target.checked)}
          className="rounded border-gray-300"
        />
        <Label htmlFor="is_active">Active Program</Label>
      </div>

      <DialogFooter>
        <div className="flex items-center justify-between w-full">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={loading}>
                Delete Program
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete program?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the program "{program.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    try {
                      const res = await deleteKhairatProgram(program.id);
                      if (res.success) {
                        toast.success('Program deleted');
                        onSuccess();
                      } else {
                        toast.error(res.error || 'Failed to delete program');
                      }
                    } catch (e) {
                      console.error(e);
                      toast.error('Failed to delete program');
                    }
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Program'}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </form>
  );
}
