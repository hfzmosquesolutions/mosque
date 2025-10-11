'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  HandHeart, 
  Users, 
  Calendar, 
  Banknote, 
  Building2, 
  FileText,
  CheckCircle,
  XCircle,
  Info
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

const AVAILABLE_SERVICES: Service[] = [
  {
    id: 'daily_prayers',
    name: 'Daily Prayers',
    description: 'Enable daily prayer times and announcements',
    icon: Calendar,
    enabled: true,
    category: 'core'
  },
  {
    id: 'friday_prayers',
    name: 'Friday Prayers (Jumuah)',
    description: 'Enable Friday prayer services and announcements',
    icon: Calendar,
    enabled: true,
    category: 'core'
  },
  {
    id: 'khairat_management',
    name: 'Khairat Management',
    description: 'Enable welfare assistance programs and contributions',
    icon: HandHeart,
    enabled: false,
    category: 'financial'
  },
  {
    id: 'kariah_management',
    name: 'Kariah Management',
    description: 'Enable member registration and management',
    icon: Users,
    enabled: false,
    category: 'management'
  },
  {
    id: 'events_management',
    name: 'Events Management',
    description: 'Enable community events and programs',
    icon: Calendar,
    enabled: false,
    category: 'community'
  },
  {
    id: 'donations',
    name: 'Donations & Infaq',
    description: 'Enable donation collection and tracking',
    icon: Banknote,
    enabled: false,
    category: 'financial'
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Enable community announcements and notifications',
    icon: FileText,
    enabled: false,
    category: 'community'
  },
  {
    id: 'mosque_profile',
    name: 'Public Profile',
    description: 'Enable public mosque profile visibility',
    icon: Building2,
    enabled: true,
    category: 'core'
  }
];

const CATEGORY_LABELS = {
  core: 'Core Services',
  community: 'Community Services',
  financial: 'Financial Services',
  management: 'Management Services'
};

const CATEGORY_ICONS = {
  core: CheckCircle,
  community: Users,
  financial: Banknote,
  management: Settings
};

export function ServiceManagement({ mosqueId, currentServices = [], onServicesUpdate }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const t = useTranslations('dashboard');

  useEffect(() => {
    // Initialize services with current state
    const initializedServices = AVAILABLE_SERVICES.map(service => ({
      ...service,
      enabled: currentServices.includes(service.id)
    }));
    setServices(initializedServices);
  }, [currentServices]);

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
        toast.success(`Service ${enabled ? 'enabled' : 'disabled'} successfully`);
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
        toast.error('Failed to update service settings');
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
      toast.error('Failed to update service settings');
    } finally {
      setSaving(false);
    }
  };

  const getCategoryServices = (category: keyof typeof CATEGORY_LABELS) => {
    return services.filter(service => service.category === category);
  };

  const getEnabledCount = (category: keyof typeof CATEGORY_LABELS) => {
    return getCategoryServices(category).filter(service => service.enabled).length;
  };

  const getTotalEnabledCount = () => {
    return services.filter(service => service.enabled).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Service Management
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enable or disable services for your mosque. Disabled services will not be visible on your public profile.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {getTotalEnabledCount()} of {services.length} enabled
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(CATEGORY_LABELS).map(([categoryKey, categoryLabel]) => {
          const categoryIcon = CATEGORY_ICONS[categoryKey as keyof typeof CATEGORY_ICONS];
          const categoryServices = getCategoryServices(categoryKey as keyof typeof CATEGORY_LABELS);
          const enabledCount = getEnabledCount(categoryKey as keyof typeof CATEGORY_LABELS);

          return (
            <div key={categoryKey} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <categoryIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{categoryLabel}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {enabledCount}/{categoryServices.length} enabled
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {categoryServices.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-muted">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">{service.name}</h4>
                            {service.enabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {service.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={service.enabled}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, checked)}
                        disabled={saving}
                      />
                    </div>
                  );
                })}
              </div>
              
              {categoryKey !== 'management' && <Separator />}
            </div>
          );
        })}

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Service Visibility
              </p>
              <p className="text-muted-foreground mt-1">
                Disabled services will not appear on your public mosque profile. 
                Users won't be able to access features for disabled services.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
