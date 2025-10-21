'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  HandHeart, 
  Users, 
  Banknote,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updateMosqueSettings, getKariahRegistrationSettings, updateKariahRegistrationSettings } from '@/lib/api';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  category: 'core' | 'community' | 'financial' | 'management';
}

interface KariahRegistrationSettings {
  requirements: string;
  benefits: string;
  custom_message: string;
}

interface ServiceManagementProps {
  mosqueId: string;
  currentServices?: string[];
  onServicesUpdate?: (services: string[]) => void;
}

const AVAILABLE_SERVICES: Service[] = [
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
    id: 'organization_people',
    name: 'Organization People',
    description: 'Show mosque organization people on public profile and enable management',
    icon: Users,
    enabled: false,
    category: 'management'
  }
];

const CATEGORY_LABELS = {
  financial: 'Financial Services',
  management: 'Management Services'
};

const CATEGORY_ICONS = {
  financial: Banknote,
  management: Settings
};

export function ServiceManagement({ mosqueId, currentServices = [], onServicesUpdate }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kariahSettings, setKariahSettings] = useState<KariahRegistrationSettings>({
    requirements: '',
    benefits: '',
    custom_message: ''
  });
  const [loadingKariahSettings, setLoadingKariahSettings] = useState(false);
  const [savingKariahSettings, setSavingKariahSettings] = useState(false);
  const t = useTranslations('dashboard');

  useEffect(() => {
    // Initialize services with current state
    const initializedServices = AVAILABLE_SERVICES.map(service => ({
      ...service,
      enabled: currentServices.includes(service.id)
    }));
    setServices(initializedServices);
  }, [currentServices]);

  useEffect(() => {
    loadKariahSettings();
  }, [mosqueId]);

  const loadKariahSettings = async () => {
    try {
      setLoadingKariahSettings(true);
      const result = await getKariahRegistrationSettings(mosqueId);
      
      if (result.success && result.data) {
        setKariahSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading kariah settings:', error);
    } finally {
      setLoadingKariahSettings(false);
    }
  };

  const saveKariahSettings = async () => {
    try {
      setSavingKariahSettings(true);
      const result = await updateKariahRegistrationSettings(mosqueId, kariahSettings);
      
      if (result.success) {
        toast.success('Kariah registration settings saved successfully');
      } else {
        toast.error(result.error || 'Failed to save kariah registration settings');
      }
    } catch (error) {
      console.error('Error saving kariah settings:', error);
      toast.error('Failed to save kariah registration settings');
    } finally {
      setSavingKariahSettings(false);
    }
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Service Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enable or disable services for your mosque. Disabled services will not be visible on your public profile.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {getTotalEnabledCount()} of {services.length} enabled
        </Badge>
      </div>
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

        {/* Kariah Registration Settings */}
        {currentServices.includes('kariah_management') && (
          <div className="space-y-4">
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Kariah Registration Settings
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure registration requirements and benefits for new ahli kariah
                  </p>
                </div>
                <Button 
                  onClick={saveKariahSettings} 
                  disabled={savingKariahSettings}
                  size="sm"
                >
                  {savingKariahSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>

              <div className="grid gap-4">
                {/* Requirements */}
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Registration Requirements
                  </Label>
                  <Textarea
                    id="requirements"
                    placeholder="e.g., Valid IC/Passport, Proof of residence in the area, Emergency contact information..."
                    value={kariahSettings.requirements}
                    onChange={(e) => 
                      setKariahSettings(prev => ({ ...prev, requirements: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                {/* Benefits */}
                <div className="space-y-2">
                  <Label htmlFor="benefits" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Membership Benefits
                  </Label>
                  <Textarea
                    id="benefits"
                    placeholder="e.g., Access to khairat programs, Community support, Voting rights in mosque decisions..."
                    value={kariahSettings.benefits}
                    onChange={(e) => 
                      setKariahSettings(prev => ({ ...prev, benefits: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label htmlFor="custom-message" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Custom Welcome Message
                  </Label>
                  <Textarea
                    id="custom-message"
                    placeholder="e.g., Welcome to our mosque community! We're excited to have you join us..."
                    value={kariahSettings.custom_message}
                    onChange={(e) => 
                      setKariahSettings(prev => ({ ...prev, custom_message: e.target.value }))
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

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
    </div>
  );
}
