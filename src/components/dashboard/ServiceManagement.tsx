'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updateMosqueSettings } from '@/lib/api';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  category: 'core' | 'community' | 'financial' | 'management';
}

interface ServiceManagementProps {
  mosqueId: string;
  currentServices?: string[];
  onServicesUpdate?: (services: string[]) => void;
}

export function ServiceManagement({ mosqueId, currentServices = [], onServicesUpdate }: ServiceManagementProps) {
  const t = useTranslations('mosquePage.serviceManagement');
  const [services, setServices] = useState<Service[]>([]);
  const [saving, setSaving] = useState(false);

  const getAvailableServices = (): Service[] => [
    {
      id: 'organization_people',
      name: t('organizationPeople'),
      description: t('organizationPeopleDescription'),
      icon: Users,
      enabled: false,
      category: 'management'
    }
  ];

  useEffect(() => {
    // Initialize services with current state
    const availableServices = getAvailableServices();
    const initializedServices = availableServices.map(service => ({
      ...service,
      enabled: currentServices.includes(service.id)
    }));
    setServices(initializedServices);
  }, [currentServices, t]);

  const handleServiceToggle = async (serviceId: string, enabled: boolean) => {
    setSaving(true);
    try {
      // Update local state immediately for better UX
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, enabled }
            : service
        )
      );

      // Get updated services list
      const updatedServices = services.map(service => 
        service.id === serviceId 
          ? { ...service, enabled }
          : service
      );

      // Get enabled service IDs
      const enabledServiceIds = updatedServices
        .filter(service => service.enabled)
        .map(service => service.id);

      // Update mosque settings
      const response = await updateMosqueSettings(mosqueId, {
        enabled_services: enabledServiceIds
      });

      if (response.success) {
        toast.success(enabled ? t('serviceEnabled') : t('serviceDisabled'));
        onServicesUpdate?.(enabledServiceIds);
      } else {
        // Revert on error
        setServices(prev => 
          prev.map(service => 
            service.id === serviceId 
              ? { ...service, enabled: !enabled }
              : service
          )
        );
        toast.error(t('failedToUpdate'));
      }
    } catch (error) {
      console.error('Error updating service:', error);
      // Revert on error
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { ...service, enabled: !enabled }
            : service
        )
      );
      toast.error(t('failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const organizationService = services.find(s => s.id === 'organization_people');

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

      {organizationService && (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-muted">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">{organizationService.name}</h4>
                {organizationService.enabled ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {organizationService.description}
              </p>
            </div>
          </div>
          <Switch
            checked={organizationService.enabled}
            onCheckedChange={(checked) => handleServiceToggle(organizationService.id, checked)}
            disabled={saving}
          />
        </div>
      )}
    </div>
  );
}
