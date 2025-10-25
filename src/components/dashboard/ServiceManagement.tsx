'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Settings, 
  HandHeart, 
  Users, 
  Banknote,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  MessageSquare,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updateMosqueSettings, getKariahRegistrationSettings, updateKariahRegistrationSettings, getKhairatRegistrationSettings, updateKhairatRegistrationSettings, getMosqueKhairatSettings, updateMosqueKhairatSettings } from '@/lib/api';
import { toast } from 'sonner';
import type { MosqueKhairatSettings } from '@/types/database';

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
  const [khairatRegistrationSettings, setKhairatRegistrationSettings] = useState<KariahRegistrationSettings>({
    requirements: '',
    benefits: '',
    custom_message: ''
  });
  const [loadingKhairatRegistrationSettings, setLoadingKhairatRegistrationSettings] = useState(false);
  const [savingKhairatRegistrationSettings, setSavingKhairatRegistrationSettings] = useState(false);
  
  // Khairat system settings (enabled, fixed price, etc.)
  const [khairatSystemSettings, setKhairatSystemSettings] = useState<MosqueKhairatSettings>({
    enabled: false,
    fixed_price: undefined,
    description: undefined,
    payment_methods: [],
    target_amount: undefined,
    start_date: undefined,
    end_date: undefined,
  });
  const [loadingKhairatSystemSettings, setLoadingKhairatSystemSettings] = useState(false);
  const [savingKhairatSystemSettings, setSavingKhairatSystemSettings] = useState(false);
  
  // Collapsible state for settings sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
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
    loadKhairatRegistrationSettings();
    loadKhairatSystemSettings();
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
    // Validate character limits
    if (kariahSettings.requirements.length > 200) {
      toast.error(t('requirementsLimitExceeded'));
      return;
    }
    if (kariahSettings.benefits.length > 200) {
      toast.error(t('benefitsLimitExceeded'));
      return;
    }
    if (kariahSettings.custom_message.length > 300) {
      toast.error(t('customMessageLimitExceeded'));
      return;
    }

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

  const loadKhairatRegistrationSettings = async () => {
    try {
      setLoadingKhairatRegistrationSettings(true);
      const result = await getKhairatRegistrationSettings(mosqueId);
      
      if (result.success && result.data) {
        setKhairatRegistrationSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading khairat registration settings:', error);
    } finally {
      setLoadingKhairatRegistrationSettings(false);
    }
  };

  const loadKhairatSystemSettings = async () => {
    try {
      setLoadingKhairatSystemSettings(true);
      const result = await getMosqueKhairatSettings(mosqueId);
      
      if (result.success && result.data) {
        setKhairatSystemSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading khairat system settings:', error);
    } finally {
      setLoadingKhairatSystemSettings(false);
    }
  };

  const saveKhairatRegistrationSettings = async () => {
    // Validate character limits
    if (khairatRegistrationSettings.requirements.length > 200) {
      toast.error(t('requirementsLimitExceeded'));
      return;
    }
    if (khairatRegistrationSettings.benefits.length > 200) {
      toast.error(t('benefitsLimitExceeded'));
      return;
    }
    if (khairatRegistrationSettings.custom_message.length > 300) {
      toast.error(t('customMessageLimitExceeded'));
      return;
    }

    try {
      setSavingKhairatRegistrationSettings(true);
      const result = await updateKhairatRegistrationSettings(mosqueId, khairatRegistrationSettings);
      
      if (result.success) {
        toast.success('Khairat registration settings saved successfully');
      } else {
        toast.error(result.error || 'Failed to save khairat registration settings');
      }
    } catch (error) {
      console.error('Error saving khairat settings:', error);
      toast.error('Failed to save khairat registration settings');
    } finally {
      setSavingKhairatRegistrationSettings(false);
    }
  };

  const saveKhairatSystemSettings = async () => {
    try {
      setSavingKhairatSystemSettings(true);
      const result = await updateMosqueKhairatSettings(mosqueId, khairatSystemSettings);
      
      if (result.success) {
        toast.success('Khairat system settings saved successfully');
      } else {
        toast.error(result.error || 'Failed to save khairat system settings');
      }
    } catch (error) {
      console.error('Error saving khairat system settings:', error);
      toast.error('Failed to save khairat system settings');
    } finally {
      setSavingKhairatSystemSettings(false);
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
        
        // Auto-expand settings section if service was enabled
        if (enabled && (serviceId === 'kariah_management' || serviceId === 'khairat_management')) {
          setExpandedSections(prev => ({
            ...prev,
            [serviceId]: true
          }));
        }
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
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
                  {React.createElement(categoryIcon, { className: "h-4 w-4 text-muted-foreground" })}
                  <h3 className="font-medium">{categoryLabel}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {enabledCount}/{categoryServices.length} enabled
                </Badge>
              </div>
              
              <div className="grid gap-3">
                {categoryServices.map((service) => {
                  const IconComponent = service.icon;
                  const isExpanded = expandedSections[service.id];
                  const hasSettings = service.id === 'kariah_management' || service.id === 'khairat_management';
                  
                  return (
                    <div key={service.id} className="space-y-2">
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={service.enabled}
                            onCheckedChange={(checked) => handleServiceToggle(service.id, checked)}
                            disabled={saving}
                          />
                          {hasSettings && service.enabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSection(service.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Collapsible settings section */}
                      {service.enabled && service.id === 'kariah_management' && (
                        <div 
                          id="kariah_management-settings" 
                          className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                  Kariah Registration Settings
                                </h4>
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
                                  maxLength={200}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{t('maxCharacters', { limit: 200 })}</span>
                                  <span className={kariahSettings.requirements.length > 200 ? 'text-red-500' : ''}>
                                    {kariahSettings.requirements.length}/200
                                  </span>
                                </div>
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
                                  maxLength={200}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{t('maxCharacters', { limit: 200 })}</span>
                                  <span className={kariahSettings.benefits.length > 200 ? 'text-red-500' : ''}>
                                    {kariahSettings.benefits.length}/200
                                  </span>
                                </div>
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
                                  maxLength={300}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{t('maxCharacters', { limit: 300 })}</span>
                                  <span className={kariahSettings.custom_message.length > 300 ? 'text-red-500' : ''}>
                                    {kariahSettings.custom_message.length}/300
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      )}
                      
                      {service.enabled && service.id === 'khairat_management' && (
                        <div 
                          id="khairat_management-settings" 
                          className={`ml-4 overflow-hidden transition-all duration-300 ease-in-out ${
                            isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="space-y-4">
                          {/* Khairat Registration Settings */}
                          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Khairat Registration Settings
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Configure registration requirements and benefits for new khairat members
                                  </p>
                                </div>
                                <Button 
                                  onClick={saveKhairatRegistrationSettings} 
                                  disabled={savingKhairatRegistrationSettings}
                                  size="sm"
                                >
                                  {savingKhairatRegistrationSettings ? 'Saving...' : 'Save Settings'}
                                </Button>
                              </div>

                              <div className="grid gap-4">
                                {/* Requirements */}
                                <div className="space-y-2">
                                  <Label htmlFor="khairat-requirements" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Registration Requirements
                                  </Label>
                                  <Textarea
                                    id="khairat-requirements"
                                    placeholder="e.g., Valid IC/Passport, Proof of residence in the area, Emergency contact information..."
                                    value={khairatRegistrationSettings.requirements}
                                    onChange={(e) => 
                                      setKhairatRegistrationSettings(prev => ({ ...prev, requirements: e.target.value }))
                                    }
                                    rows={3}
                                    maxLength={200}
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{t('maxCharacters', { limit: 200 })}</span>
                                    <span className={khairatRegistrationSettings.requirements.length > 200 ? 'text-red-500' : ''}>
                                      {khairatRegistrationSettings.requirements.length}/200
                                    </span>
                                  </div>
                                </div>

                                {/* Benefits */}
                                <div className="space-y-2">
                                  <Label htmlFor="khairat-benefits" className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Membership Benefits
                                  </Label>
                                  <Textarea
                                    id="khairat-benefits"
                                    placeholder="e.g., Access to khairat programs, Community support, Voting rights in mosque decisions..."
                                    value={khairatRegistrationSettings.benefits}
                                    onChange={(e) => 
                                      setKhairatRegistrationSettings(prev => ({ ...prev, benefits: e.target.value }))
                                    }
                                    rows={3}
                                    maxLength={200}
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{t('maxCharacters', { limit: 200 })}</span>
                                    <span className={khairatRegistrationSettings.benefits.length > 200 ? 'text-red-500' : ''}>
                                      {khairatRegistrationSettings.benefits.length}/200
                                    </span>
                                  </div>
                                </div>

                                {/* Custom Message */}
                                <div className="space-y-2">
                                  <Label htmlFor="khairat-custom-message" className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Custom Welcome Message
                                  </Label>
                                  <Textarea
                                    id="khairat-custom-message"
                                    placeholder="e.g., Welcome to our khairat community! We're excited to have you join us in supporting our mosque and community..."
                                    value={khairatRegistrationSettings.custom_message}
                                    onChange={(e) => 
                                      setKhairatRegistrationSettings(prev => ({ ...prev, custom_message: e.target.value }))
                                    }
                                    rows={4}
                                    maxLength={300}
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{t('maxCharacters', { limit: 300 })}</span>
                                    <span className={khairatRegistrationSettings.custom_message.length > 300 ? 'text-red-500' : ''}>
                                      {khairatRegistrationSettings.custom_message.length}/300
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Khairat System Settings */}
                          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Khairat System Settings
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Configure the khairat kematian system for your mosque
                                  </p>
                                </div>
                                <Button 
                                  onClick={saveKhairatSystemSettings} 
                                  disabled={savingKhairatSystemSettings}
                                  size="sm"
                                >
                                  {savingKhairatSystemSettings ? 'Saving...' : 'Save Settings'}
                                </Button>
                              </div>

                              <div className="grid gap-4">
                                {/* Enable Khairat */}
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <Label htmlFor="khairat-enabled">Enable Khairat System</Label>
                                    <p className="text-sm text-muted-foreground">
                                      Allow members to make khairat contributions
                                    </p>
                                  </div>
                                  <Switch
                                    id="khairat-enabled"
                                    checked={khairatSystemSettings.enabled}
                                    onCheckedChange={(checked) => 
                                      setKhairatSystemSettings(prev => ({ ...prev, enabled: checked }))
                                    }
                                  />
                                </div>

                                {khairatSystemSettings.enabled && (
                                  <>
                                    {/* Description */}
                                    <div className="space-y-2">
                                      <Label htmlFor="khairat-description">Description</Label>
                                      <Textarea
                                        id="khairat-description"
                                        placeholder="Describe your khairat system..."
                                        value={khairatSystemSettings.description || ''}
                                        onChange={(e) => 
                                          setKhairatSystemSettings(prev => ({ ...prev, description: e.target.value }))
                                        }
                                        rows={3}
                                      />
                                    </div>

                                    {/* Fixed Price */}
                                    <div className="space-y-2">
                                      <Label htmlFor="khairat-fixed-price">Fixed Price (RM)</Label>
                                      <Input
                                        id="khairat-fixed-price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={khairatSystemSettings.fixed_price?.toString() || ''}
                                        onChange={(e) => 
                                          setKhairatSystemSettings(prev => ({ 
                                            ...prev, 
                                            fixed_price: parseFloat(e.target.value) || undefined 
                                          }))
                                        }
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Leave empty to allow any amount
                                      </p>
                                    </div>

                                    {/* Target Amount */}
                                    <div className="space-y-2">
                                      <Label htmlFor="khairat-target-amount">Target Amount (RM)</Label>
                                      <Input
                                        id="khairat-target-amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={khairatSystemSettings.target_amount?.toString() || ''}
                                        onChange={(e) => 
                                          setKhairatSystemSettings(prev => ({ 
                                            ...prev, 
                                            target_amount: parseFloat(e.target.value) || undefined 
                                          }))
                                        }
                                      />
                                      <p className="text-xs text-muted-foreground">
                                        Optional target amount for the khairat fund
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                      )}
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
    </div>
  );
}
