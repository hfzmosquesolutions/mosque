'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Save, X } from 'lucide-react';
import type { EventFormData } from '@/types/database';

interface EventFormProps {
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<EventFormData>;
  isLoading?: boolean;
}

const EVENT_CATEGORIES = [
  'Religious',
  'Educational',
  'Community',
  'Youth',
  'Women',
  'Charity',
  'Cultural',
  'Social',
  'Health',
  'Other',
];

export function EventForm({ onSubmit, onCancel, initialData, isLoading }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    event_date: initialData?.event_date || '',
    end_date: initialData?.end_date || '',
    location: initialData?.location || '',
    max_attendees: initialData?.max_attendees || undefined,
    registration_required: initialData?.registration_required || false,
    registration_deadline: initialData?.registration_deadline || '',
    category: initialData?.category || '',
    image_url: initialData?.image_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    } else {
      const eventDate = new Date(formData.event_date);
      const now = new Date();
      if (eventDate < now) {
        newErrors.event_date = 'Event date cannot be in the past';
      }
    }

    if (formData.end_date && formData.event_date) {
      const startDate = new Date(formData.event_date);
      const endDate = new Date(formData.end_date);
      if (endDate < startDate) {
        newErrors.end_date = 'End date cannot be before start date';
      }
    }

    if (formData.registration_required && formData.registration_deadline) {
      const registrationDeadline = new Date(formData.registration_deadline);
      const eventDate = new Date(formData.event_date);
      if (registrationDeadline > eventDate) {
        newErrors.registration_deadline = 'Registration deadline cannot be after event date';
      }
    }

    if (formData.max_attendees && formData.max_attendees < 1) {
      newErrors.max_attendees = 'Maximum attendees must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to submit event form:', error);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter event title"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the event..."
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date and Time */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Date & Time
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="event_date">Start Date & Time *</Label>
            <Input
              id="event_date"
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => handleInputChange('event_date', e.target.value)}
              className={errors.event_date ? 'border-red-500' : ''}
            />
            {errors.event_date && (
              <p className="text-sm text-red-500">{errors.event_date}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date & Time</Label>
            <Input
              id="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className={errors.end_date ? 'border-red-500' : ''}
            />
            {errors.end_date && (
              <p className="text-sm text-red-500">{errors.end_date}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Location
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="location">Event Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter event location or 'Online' for virtual events"
          />
        </div>
      </div>

      {/* Registration Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Registration
        </h3>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="registration_required"
            checked={formData.registration_required}
            onCheckedChange={(checked) => handleInputChange('registration_required', checked)}
          />
          <Label htmlFor="registration_required">Require registration for this event</Label>
        </div>

        {formData.registration_required && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
            <div className="space-y-2">
              <Label htmlFor="max_attendees">Maximum Attendees</Label>
              <Input
                id="max_attendees"
                type="number"
                min="1"
                value={formData.max_attendees || ''}
                onChange={(e) => handleInputChange('max_attendees', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave empty for unlimited"
                className={errors.max_attendees ? 'border-red-500' : ''}
              />
              {errors.max_attendees && (
                <p className="text-sm text-red-500">{errors.max_attendees}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input
                id="registration_deadline"
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange('registration_deadline', e.target.value)}
                className={errors.registration_deadline ? 'border-red-500' : ''}
              />
              {errors.registration_deadline && (
                <p className="text-sm text-red-500">{errors.registration_deadline}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image URL */}
      <div className="space-y-2">
        <Label htmlFor="image_url">Event Image URL</Label>
        <Input
          id="image_url"
          type="url"
          value={formData.image_url}
          onChange={(e) => handleInputChange('image_url', e.target.value)}
          placeholder="https://example.com/event-image.jpg"
        />
        <p className="text-sm text-muted-foreground">
          Optional: Add an image URL to make your event more attractive
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Event'}
        </Button>
      </div>
    </form>
  );
}