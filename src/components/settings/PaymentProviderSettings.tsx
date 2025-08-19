'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  CreditCard,
  CheckCircle,
  Eye,
  EyeOff,
  AlertCircle,
  Save,
  Loader2,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface PaymentProvider {
  id: string;
  mosque_id: string;
  provider_type: string;
  provider_config: {
    billplz_api_key: string;
    billplz_x_signature_key: string;
    billplz_collection_id: string;
  };
  is_active: boolean;
  is_sandbox: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentProviderFormData {
  billplz_api_key: string;
  billplz_x_signature_key: string;
  billplz_collection_id: string;
  is_active: boolean;
  is_sandbox: boolean;
}

export function PaymentProviderSettings() {
  const { user } = useAuth();
  const { isAdmin, mosqueId } = useUserRole();

  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider | null>(null);
  const [formData, setFormData] = useState<PaymentProviderFormData>({
    billplz_api_key: '',
    billplz_x_signature_key: '',
    billplz_collection_id: '',
    is_active: false,
    is_sandbox: true,
  });

  // Generate system URLs
  const generateSystemUrls = () => {
    if (typeof window === 'undefined' || !mosqueId)
      return { webhookUrl: '', redirectUrl: '' };

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return {
      webhookUrl: `${baseUrl}/api/webhooks/billplz/callback`,
      redirectUrl: `${baseUrl}/api/webhooks/billplz/redirect?mosque_id=${mosqueId}`,
    };
  };

  const { webhookUrl, redirectUrl } = generateSystemUrls();

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSignatureKey, setShowSignatureKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !mosqueId) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    loadPaymentProvider();
  }, [isAdmin, mosqueId]);

  const loadPaymentProvider = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/payment-providers?mosqueId=${mosqueId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment provider');
      }

      if (data.billplz) {
        setPaymentProvider(data.billplz);
        setFormData({
          billplz_api_key: data.billplz.billplz_api_key || '',
          billplz_x_signature_key: data.billplz.billplz_x_signature_key || '',
          billplz_collection_id: data.billplz.billplz_collection_id || '',
          is_active: data.billplz.is_active,
          is_sandbox: data.billplz.is_sandbox,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load payment provider'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (
    field: keyof PaymentProviderFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!mosqueId) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/payment-providers', {
        method: paymentProvider ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mosqueId: mosqueId,
          providerType: 'billplz',
          billplz_api_key: formData.billplz_api_key,
          billplz_x_signature_key: formData.billplz_x_signature_key,
          billplz_collection_id: formData.billplz_collection_id,
          is_active: formData.is_active,
          is_sandbox: formData.is_sandbox,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment provider');
      }

      // Refresh the data after successful save
      await loadPaymentProvider();
      toast.success('Payment provider settings saved successfully!');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save payment provider';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.billplz_api_key || !formData.billplz_collection_id) {
      toast.error(
        'Please provide API Key and Collection ID to test connection'
      );
      return;
    }

    try {
      setTesting(true);

      const response = await fetch('/api/admin/payment-providers/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerType: 'billplz',
          apiKey: formData.billplz_api_key,
          collectionId: formData.billplz_collection_id,
          isSandbox: formData.is_sandbox,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed');
      }

      toast.success(
        'Connection test successful! Billplz API is working correctly.'
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Connection test failed';
      toast.error(errorMessage);
    } finally {
      setTesting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You need administrator privileges to access payment settings.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              <CardTitle>Payment Gateway</CardTitle>
            </div>
            <CardDescription>
              Configure how your mosque accepts online donations and
              contributions from members
            </CardDescription>
          </div>
          {paymentProvider?.is_active && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Status and Mode */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                updateFormData('is_active', checked)
              }
            />
            <div>
              <Label className="text-sm font-medium">
                Enable Online Donations
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow members to donate and pay contributions online to your
                mosque
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sandbox Mode</Label>
            <Switch
              checked={formData.is_sandbox}
              onCheckedChange={(checked) =>
                updateFormData('is_sandbox', checked)
              }
            />
          </div>
        </div>

        {/* API Configuration */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key *</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={formData.billplz_api_key}
                onChange={(e) =>
                  updateFormData('billplz_api_key', e.target.value)
                }
                placeholder="Enter your Billplz API Key"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signatureKey">X-Signature Key *</Label>
            <div className="relative">
              <Input
                id="signatureKey"
                type={showSignatureKey ? 'text' : 'password'}
                value={formData.billplz_x_signature_key}
                onChange={(e) =>
                  updateFormData('billplz_x_signature_key', e.target.value)
                }
                placeholder="Enter your X-Signature Key"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowSignatureKey(!showSignatureKey)}
              >
                {showSignatureKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collectionId">Collection ID *</Label>
            <Input
              id="collectionId"
              value={formData.billplz_collection_id}
              onChange={(e) =>
                updateFormData('billplz_collection_id', e.target.value)
              }
              placeholder="Enter your Billplz Collection ID"
            />
          </div>

          {/* System Generated URLs */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-blue-600">
                System Generated URLs
              </Label>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Copy these URLs and paste them into your Billplz dashboard
              settings.
            </p>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Webhook URL (Callback URL)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="bg-background font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Billplz will send payment notifications to this URL
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Redirect URL (Return URL)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={redirectUrl}
                    readOnly
                    className="bg-background font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(redirectUrl, 'Redirect URL')}
                    className="shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Users will be redirected to this URL after payment completion
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Information */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <p className="font-medium mb-2">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Sign up for a Billplz account at billplz.com</li>
                  <li>Go to Settings → API Keys to get your API Key</li>
                  <li>
                    Go to Settings → X-Signature Key to get your X-Signature Key
                  </li>
                  <li>Create a Collection and copy the Collection ID</li>
                  <li>
                    <strong>
                      Copy the Webhook URL and Redirect URL above and paste them
                      into your Billplz Collection settings
                    </strong>
                  </li>
                </ol>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.billplz.com/api#introduction"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    API Documentation
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.billplz.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Billplz Dashboard
                  </a>
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={
              testing ||
              !formData.billplz_api_key ||
              !formData.billplz_collection_id
            }
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
