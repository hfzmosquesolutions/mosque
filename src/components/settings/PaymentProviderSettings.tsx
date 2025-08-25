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
  provider_type: 'billplz' | 'toyyibpay';
  billplz_api_key?: string;
  billplz_x_signature_key?: string;
  billplz_collection_id?: string;
  toyyibpay_secret_key?: string;
  toyyibpay_category_code?: string;
  is_active: boolean;
  is_sandbox: boolean;
  created_at: string;
  updated_at: string;
}

interface BillplzFormData {
  billplz_api_key: string;
  billplz_x_signature_key: string;
  billplz_collection_id: string;
  is_active: boolean;
  is_sandbox: boolean;
}

interface ToyyibPayFormData {
  toyyibpay_secret_key: string;
  toyyibpay_category_code: string;
  is_active: boolean;
  is_sandbox: boolean;
}

type PaymentProviderFormData = BillplzFormData | ToyyibPayFormData;
type ProviderType = 'billplz' | 'toyyibpay';

export function PaymentProviderSettings() {
  const { user } = useAuth();
  const { isAdmin, mosqueId } = useUserRole();

  const [selectedProvider, setSelectedProvider] =
    useState<ProviderType>('billplz');
  const [paymentProviders, setPaymentProviders] = useState<{
    billplz?: PaymentProvider;
    toyyibpay?: PaymentProvider;
  }>({});
  const [billplzFormData, setBillplzFormData] = useState<BillplzFormData>({
    billplz_api_key: '',
    billplz_x_signature_key: '',
    billplz_collection_id: '',
    is_active: false,
    is_sandbox: true,
  });
  const [toyyibPayFormData, setToyyibPayFormData] = useState<ToyyibPayFormData>(
    {
      toyyibpay_secret_key: '',
      toyyibpay_category_code: '',
      is_active: false,
      is_sandbox: true,
    }
  );

  // Generate system URLs
  const generateSystemUrls = (providerType: ProviderType) => {
    if (typeof window === 'undefined' || !mosqueId)
      return { webhookUrl: '', redirectUrl: '' };

    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    return {
      webhookUrl: `${baseUrl}/api/webhooks/${providerType}/callback`,
      redirectUrl: `${baseUrl}/api/webhooks/${providerType}/redirect?mosque_id=${mosqueId}`,
    };
  };

  const { webhookUrl, redirectUrl } = generateSystemUrls(selectedProvider);

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !mosqueId) {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    loadPaymentProviders();
  }, [isAdmin, mosqueId]);

  const loadPaymentProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${window.location.origin}/api/admin/payment-providers?mosqueId=${mosqueId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment providers');
      }

      if (data.billplz) {
        setPaymentProviders((prev) => ({ ...prev, billplz: data.billplz }));
        setBillplzFormData({
          billplz_api_key: data.billplz.billplz_api_key || '',
          billplz_x_signature_key: data.billplz.billplz_x_signature_key || '',
          billplz_collection_id: data.billplz.billplz_collection_id || '',
          is_active: data.billplz.is_active,
          is_sandbox: data.billplz.is_sandbox,
        });
      }

      if (data.toyyibpay) {
        setPaymentProviders((prev) => ({ ...prev, toyyibpay: data.toyyibpay }));
        setToyyibPayFormData({
          toyyibpay_secret_key: data.toyyibpay.toyyibpay_secret_key || '',
          toyyibpay_category_code: data.toyyibpay.toyyibpay_category_code || '',
          is_active: data.toyyibpay.is_active,
          is_sandbox: data.toyyibpay.is_sandbox,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load payment providers'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    if (selectedProvider === 'billplz') {
      setBillplzFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setToyyibPayFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!mosqueId) return;

    try {
      setSaving(true);
      setError(null);

      const formData =
        selectedProvider === 'billplz' ? billplzFormData : toyyibPayFormData;
      const existingProvider = paymentProviders[selectedProvider];

      const response = await fetch(
        `${window.location.origin}/api/admin/payment-providers`,
        {
          method: existingProvider ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mosqueId: mosqueId,
            providerType: selectedProvider,
            ...formData,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment provider');
      }

      // Refresh the data after successful save
      await loadPaymentProviders();
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
    const formData =
      selectedProvider === 'billplz' ? billplzFormData : toyyibPayFormData;

    if (selectedProvider === 'billplz') {
      if (
        !billplzFormData.billplz_api_key ||
        !billplzFormData.billplz_collection_id
      ) {
        toast.error(
          'Please provide API Key and Collection ID to test connection'
        );
        return;
      }
    } else {
      if (
        !toyyibPayFormData.toyyibpay_secret_key ||
        !toyyibPayFormData.toyyibpay_category_code
      ) {
        toast.error(
          'Please provide Secret Key and Category Code to test connection'
        );
        return;
      }
    }

    try {
      setTesting(true);

      const testData =
        selectedProvider === 'billplz'
          ? {
              providerType: 'billplz',
              apiKey: billplzFormData.billplz_api_key,
              collectionId: billplzFormData.billplz_collection_id,
              isSandbox: billplzFormData.is_sandbox,
            }
          : {
              providerType: 'toyyibpay',
              secretKey: toyyibPayFormData.toyyibpay_secret_key,
              categoryCode: toyyibPayFormData.toyyibpay_category_code,
              isSandbox: toyyibPayFormData.is_sandbox,
            };

      const response = await fetch(
        `${window.location.origin}/api/admin/payment-providers/test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed');
      }

      toast.success(
        `Connection test successful! ${
          selectedProvider === 'billplz' ? 'Billplz' : 'ToyyibPay'
        } API is working correctly.`
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
          {paymentProviders[selectedProvider]?.is_active && (
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
        {/* Provider Selection */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Payment Provider:</Label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                value="billplz"
                checked={selectedProvider === 'billplz'}
                onChange={(e) =>
                  setSelectedProvider(e.target.value as ProviderType)
                }
                className="w-4 h-4"
              />
              <span className="text-sm">Billplz</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="provider"
                value="toyyibpay"
                checked={selectedProvider === 'toyyibpay'}
                onChange={(e) =>
                  setSelectedProvider(e.target.value as ProviderType)
                }
                className="w-4 h-4"
              />
              <span className="text-sm">ToyyibPay</span>
            </label>
          </div>
        </div>

        {/* Status and Mode */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Switch
              checked={
                selectedProvider === 'billplz'
                  ? billplzFormData.is_active
                  : toyyibPayFormData.is_active
              }
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
              checked={
                selectedProvider === 'billplz'
                  ? billplzFormData.is_sandbox
                  : toyyibPayFormData.is_sandbox
              }
              onCheckedChange={(checked) =>
                updateFormData('is_sandbox', checked)
              }
            />
          </div>
        </div>

        {/* API Configuration */}
        <div className="grid gap-4">
          {selectedProvider === 'billplz' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={billplzFormData.billplz_api_key}
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
                    value={billplzFormData.billplz_x_signature_key}
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
                  value={billplzFormData.billplz_collection_id}
                  onChange={(e) =>
                    updateFormData('billplz_collection_id', e.target.value)
                  }
                  placeholder="Enter your Billplz Collection ID"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key *</Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={toyyibPayFormData.toyyibpay_secret_key}
                    onChange={(e) =>
                      updateFormData('toyyibpay_secret_key', e.target.value)
                    }
                    placeholder="Enter your ToyyibPay Secret Key"
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
                <Label htmlFor="categoryCode">Category Code *</Label>
                <Input
                  id="categoryCode"
                  value={toyyibPayFormData.toyyibpay_category_code}
                  onChange={(e) =>
                    updateFormData('toyyibpay_category_code', e.target.value)
                  }
                  placeholder="Enter your ToyyibPay Category Code"
                />
              </div>
            </>
          )}

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
                {selectedProvider === 'billplz' ? (
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Sign up for a Billplz account at billplz.com</li>
                    <li>Go to Settings → API Keys to get your API Key</li>
                    <li>
                      Go to Settings → X-Signature Key to get your X-Signature
                      Key
                    </li>
                    <li>Create a Collection and copy the Collection ID</li>
                    <li>
                      <strong>
                        Copy the Webhook URL and Redirect URL above and paste
                        them into your Billplz Collection settings
                      </strong>
                    </li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Sign up for a ToyyibPay account at toyyibpay.com</li>
                    <li>Go to Settings → API to get your Secret Key</li>
                    <li>Create a Category and copy the Category Code</li>
                    <li>
                      <strong>
                        Copy the Webhook URL and Redirect URL above and paste
                        them into your ToyyibPay settings
                      </strong>
                    </li>
                  </ol>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedProvider === 'billplz' ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href="https://dev.toyyibpay.com/"
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
                        href="https://toyyibpay.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        ToyyibPay Dashboard
                      </a>
                    </Button>
                  </>
                )}
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
              (selectedProvider === 'billplz' &&
                (!billplzFormData.billplz_api_key ||
                  !billplzFormData.billplz_collection_id)) ||
              (selectedProvider === 'toyyibpay' &&
                (!toyyibPayFormData.toyyibpay_secret_key ||
                  !toyyibPayFormData.toyyibpay_category_code))
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
