'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Loader2,
  Save,
  Heart,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import {
  getMosqueKhairatSettings,
  updateMosqueKhairatSettings,
  getUserMosqueId,
} from '@/lib/api';
import type { MosqueKhairatSettings } from '@/types/database';
import { toast } from 'sonner';

interface MosqueKhairatSettingsProps {
  onSettingsUpdate?: () => void;
}

export function MosqueKhairatSettings({
  onSettingsUpdate,
}: MosqueKhairatSettingsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mosqueId, setMosqueId] = useState<string | null>(null);
  const [settings, setSettings] = useState<MosqueKhairatSettings>({
    enabled: false,
    fixed_price: undefined,
    description: undefined,
    payment_methods: [],
    target_amount: undefined,
    start_date: undefined,
    end_date: undefined,
  });

  const loadMosqueId = useCallback(async () => {
    if (!user) return;
    
    try {
      const mosqueId = await getUserMosqueId(user.id);
      if (mosqueId) {
        setMosqueId(mosqueId);
      } else {
        toast.error('You are not associated with any mosque');
      }
    } catch (error) {
      console.error('Error loading mosque ID:', error);
      toast.error('Failed to load mosque information');
    }
  }, [user]);

  const loadSettings = useCallback(async () => {
    if (!mosqueId) return;
    
    setLoading(true);
    try {
      const response = await getMosqueKhairatSettings(mosqueId);
      if (response.success && response.data) {
        setSettings(response.data);
      } else {
        console.error('Failed to load settings:', response.error);
        // Don't show error toast for default settings
      }
    } catch (error) {
      console.error('Error loading khairat settings:', error);
      // Don't show error toast for default settings
    } finally {
      setLoading(false);
    }
  }, [mosqueId]);

  useEffect(() => {
    if (user) {
      loadMosqueId();
    }
  }, [user, loadMosqueId]);

  useEffect(() => {
    if (mosqueId) {
      loadSettings();
    }
  }, [mosqueId, loadSettings]);

  const handleSave = async () => {
    if (!mosqueId) {
      toast.error('Mosque not found');
      return;
    }

    setSaving(true);
    try {
      const response = await updateMosqueKhairatSettings(mosqueId, settings);
      if (response.success) {
        toast.success('Khairat settings updated successfully!');
        onSettingsUpdate?.();
      } else {
        toast.error(response.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating khairat settings:', error);
      toast.error('Failed to update khairat settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof MosqueKhairatSettings>(
    key: K,
    value: MosqueKhairatSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Khairat Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Khairat Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Khairat */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="enabled" className="text-base font-medium">
              Enable Khairat Contributions
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow members to make khairat contributions to this mosque
            </p>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        <Separator />

        {settings.enabled && (
          <>
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the khairat program (optional)"
                value={settings.description || ''}
                onChange={(e) => updateSetting('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Fixed Price */}
            <div className="space-y-2">
              <Label htmlFor="fixed_price">Fixed Price (RM)</Label>
              <Input
                id="fixed_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave empty for flexible pricing"
                value={settings.fixed_price || ''}
                onChange={(e) => 
                  updateSetting('fixed_price', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
              <p className="text-xs text-muted-foreground">
                Set a fixed amount for all khairat contributions, or leave empty for flexible pricing
              </p>
              {settings.payment_methods?.includes('toyyibpay') && (
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Please include the ToyyibPay transaction fee in your price to ensure you receive the full intended amount.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Target Amount */}
            <div className="space-y-2">
              <Label htmlFor="target_amount">Target Amount (RM)</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Optional target amount"
                value={settings.target_amount || ''}
                onChange={(e) => 
                  updateSetting('target_amount', e.target.value ? parseFloat(e.target.value) : undefined)
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional target amount for the khairat program
              </p>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={settings.start_date || ''}
                  onChange={(e) => updateSetting('start_date', e.target.value || undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={settings.end_date || ''}
                  onChange={(e) => updateSetting('end_date', e.target.value || undefined)}
                />
              </div>
            </div>

            <Separator />

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Payment Methods</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['cash', 'bank_transfer', 'toyyibpay'].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={method}
                      checked={settings.payment_methods?.includes(method) || false}
                      onChange={(e) => {
                        const currentMethods = settings.payment_methods || [];
                        if (e.target.checked) {
                          updateSetting('payment_methods', [...currentMethods, method]);
                        } else {
                          updateSetting('payment_methods', currentMethods.filter(m => m !== method));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={method} className="capitalize">
                      {method.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
