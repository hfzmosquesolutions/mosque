'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAdminAccess, useUserMosque } from '@/hooks/useUserRole';
import { useOnboardingRedirect } from '@/hooks/useOnboardingStatus';
import { useSubscription } from '@/hooks/useSubscription';
import { PaymentProviderSettings } from '@/components/settings/PaymentProviderSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  CreditCard, 
  Building2, 
  Banknote, 
  Settings,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { getMosque, updateMosqueSettings, getMosqueKhairatSettings, updateMosqueKhairatSettings } from '@/lib/api';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Save } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { MosqueKhairatSettings } from '@/types/database';

function PaymentSettingsContent() {
  const t = useTranslations('khairat');
  const tBilling = useTranslations('billing.pricing');
  const locale = useLocale();
  const { hasAdminAccess, loading: adminLoading } = useAdminAccess();
  const { isCompleted, isLoading: onboardingLoading } = useOnboardingRedirect();
  const { mosqueId } = useUserMosque();
  const { plan, loading: subscriptionLoading } = useSubscription(mosqueId || '');
  const isFreePlan = plan === 'free';
  const [paymentMethods, setPaymentMethods] = useState({
    online_payment: true,
    bank_transfer: true,
    cash: true,
  });
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false);
  const [isOnlinePaymentOpen, setIsOnlinePaymentOpen] = useState(false);
  const [isBankTransferOpen, setIsBankTransferOpen] = useState(false);
  const [isCashOpen, setIsCashOpen] = useState(false);
  const [bankTransferDetails, setBankTransferDetails] = useState({
    bank_name: '',
    account_number: '',
    account_holder_name: '',
    reference_instructions: '',
  });
  const [cashDetails, setCashDetails] = useState({
    payment_location: '',
    office_hours: '',
    contact_person: '',
    contact_phone: '',
    instructions: '',
  });
  const [savingBankDetails, setSavingBankDetails] = useState(false);
  const [savingCashDetails, setSavingCashDetails] = useState(false);
  
  // Khairat fixed prices (no separate enabled toggle - payment method toggles control access)
  const [khairatFixedPrices, setKhairatFixedPrices] = useState<{
    online_payment?: number;
    bank_transfer?: number;
    cash?: number;
  }>({
    online_payment: undefined,
    bank_transfer: undefined,
    cash: undefined,
  });
  const [loadingKhairatSettings, setLoadingKhairatSettings] = useState(false);
  const [savingKhairatPrices, setSavingKhairatPrices] = useState(false);

  useEffect(() => {
    if (mosqueId) {
      loadPaymentMethods();
      loadKhairatSettings();
    }
  }, [mosqueId, plan]);

  // Removed auto-expand on page load - toggles should be closed by default
  // They will only expand when user enables a payment method via handlePaymentMethodToggle

  const loadPaymentMethods = async () => {
    if (!mosqueId) return;
    
    try {
      setLoadingMethods(true);
      const response = await getMosque(mosqueId);
      if (response.success && response.data) {
        const settings = response.data.settings as Record<string, any> | undefined;
        const enabledPaymentMethods = settings?.enabled_payment_methods || {};
        const bankDetails = settings?.bank_transfer_details || {};
        
        // For free plan, force disable online payment
        const currentPlan = plan || 'free';
        const isFree = currentPlan === 'free';
        setPaymentMethods({
          online_payment: isFree ? false : (enabledPaymentMethods.online_payment !== false),
          bank_transfer: enabledPaymentMethods.bank_transfer !== false,
          cash: enabledPaymentMethods.cash !== false,
        });
        
        setBankTransferDetails({
          bank_name: bankDetails.bank_name || '',
          account_number: bankDetails.account_number || '',
          account_holder_name: bankDetails.account_holder_name || '',
          reference_instructions: bankDetails.reference_instructions || '',
        });
        
        const cashDetails = settings?.cash_payment_details || {};
        setCashDetails({
          payment_location: cashDetails.payment_location || '',
          office_hours: cashDetails.office_hours || '',
          contact_person: cashDetails.contact_person || '',
          contact_phone: cashDetails.contact_phone || '',
          instructions: cashDetails.instructions || '',
        });
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handlePaymentMethodToggle = (method: 'online_payment' | 'bank_transfer' | 'cash', enabled: boolean) => {
    // Check if trying to enable online payment on free plan
    if (method === 'online_payment' && enabled && isFreePlan) {
      toast.error(t('paymentProviderSettings.onlinePaymentRequiresUpgrade') || 'Online payment requires Standard or Pro plan. Please upgrade to use this feature.');
      return;
    }
    
    // Just update local state, don't save immediately
    const updatedMethods = {
      ...paymentMethods,
      [method]: enabled,
    };
    
    // If free plan, force disable online payment
    if (isFreePlan) {
      updatedMethods.online_payment = false;
    }
    
    setPaymentMethods(updatedMethods);
  };

  const handleBankDetailsSave = async () => {
    if (!mosqueId) return;
    
    try {
      setSavingBankDetails(true);
      const response = await updateMosqueSettings(mosqueId, {
        bank_transfer_details: bankTransferDetails,
        enabled_payment_methods: {
          ...paymentMethods,
          bank_transfer: paymentMethods.bank_transfer,
        },
      });
      
      if (response.success) {
        toast.success(t('paymentProviderSettings.bankDetailsUpdated') || 'Bank transfer details saved');
      } else {
        toast.error(response.error || 'Failed to save bank details');
      }
    } catch (err) {
      toast.error('Failed to save bank details');
    } finally {
      setSavingBankDetails(false);
    }
  };

  const handleCashDetailsSave = async () => {
    if (!mosqueId) return;
    
    try {
      setSavingCashDetails(true);
      const response = await updateMosqueSettings(mosqueId, {
        cash_payment_details: cashDetails,
        enabled_payment_methods: {
          ...paymentMethods,
          cash: paymentMethods.cash,
        },
      });
      
      if (response.success) {
        toast.success(t('paymentProviderSettings.cashDetailsUpdated') || 'Cash payment details saved');
      } else {
        toast.error(response.error || 'Failed to save cash details');
      }
    } catch (err) {
      toast.error('Failed to save cash details');
    } finally {
      setSavingCashDetails(false);
    }
  };

  const loadKhairatSettings = async () => {
    if (!mosqueId) return;
    
    try {
      setLoadingKhairatSettings(true);
      const response = await getMosqueKhairatSettings(mosqueId);
      if (response.success && response.data) {
        // Only load fixed prices, ignore enabled/description/target_amount
        const settings = response.data;
        setKhairatFixedPrices(settings.fixed_prices || {
          online_payment: undefined,
          bank_transfer: undefined,
          cash: undefined,
        });
      }
    } catch (error) {
      console.error('Error loading khairat settings:', error);
    } finally {
      setLoadingKhairatSettings(false);
    }
  };

  const handleKhairatPricesSave = async (paymentMethod?: 'online_payment' | 'bank_transfer' | 'cash') => {
    if (!mosqueId) return;
    
    // Only prevent saving online_payment for free plan users
    if (isFreePlan && paymentMethod === 'online_payment') {
      toast.error(t('paymentProviderSettings.onlinePaymentRequiresUpgrade') || 'Online payment requires Standard or Pro plan. Please upgrade to use this feature.');
      return;
    }
    
    try {
      setSavingKhairatPrices(true);
      
      // Get current khairat settings to preserve other fields
      const currentSettingsRes = await getMosqueKhairatSettings(mosqueId);
      const currentSettings = currentSettingsRes.success && currentSettingsRes.data 
        ? currentSettingsRes.data 
        : { enabled: true };
      
      // Save fixed prices and preserve other settings
      const khairatResponse = await updateMosqueKhairatSettings(mosqueId, {
        ...currentSettings,
        enabled: currentSettings.enabled !== false, // Keep enabled for backward compatibility
        fixed_prices: khairatFixedPrices,
      } as MosqueKhairatSettings);
      
      if (khairatResponse.success) {
        toast.success(t('paymentProviderSettings.khairatPricesUpdated') || 'Settings saved');
        // Reload settings to reflect changes
        await loadKhairatSettings();
      } else {
        toast.error('Failed to save fixed prices');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingKhairatPrices(false);
    }
  };

  if (onboardingLoading || !isCompleted || adminLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">{t('loadingKhairatData')}</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">{t('paymentProviderSettings.accessDenied')}</h2>
            <p className="text-muted-foreground">
              {t('paymentProviderSettings.accessDeniedDescription')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('paymentGatewaySetup')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {t('paymentGatewaySetupDescription')}
          </p>
        </div>
        {mosqueId && (
          <Link href={`/${locale}/khairat/pay/${mosqueId}`} target="_blank" rel="noopener noreferrer">
            <Button className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('paymentProviderSettings.viewPaymentPage') || 'View Payment Page'}
            </Button>
          </Link>
        )}
      </div>

      {/* Plan-based restrictions alert */}
      {isFreePlan && (
        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-900 dark:text-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">
                  {t('paymentProviderSettings.freePlanRestriction') || 'Free Plan Limitation'}
                </p>
                <p className="text-sm">
                  {t('paymentProviderSettings.freePlanRestrictionDescription') || 
                   'Free plan only supports bank transfer and cash payments. Upgrade to Standard or Pro plan to enable online payments.'}
                </p>
              </div>
              <Link href="/billing?tab=plans">
                <Button size="sm" variant="outline" className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/40">
                  {t('paymentProviderSettings.upgradeNow') || 'Upgrade Now'}
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Methods Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-600" />
            <CardTitle>
              {t('paymentProviderSettings.enabledPaymentMethods') || 'Payment Methods'}
            </CardTitle>
          </div>
          <CardDescription>
            {t('paymentProviderSettings.enabledPaymentMethodsDescription') || 
             'Enable payment methods for your mosque. Configure settings for each method below.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingMethods ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Online Payment with Inline Configuration */}
              <Collapsible 
                open={isOnlinePaymentOpen} 
                onOpenChange={setIsOnlinePaymentOpen}
                className="space-y-4"
              >
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-4 flex-1 cursor-pointer">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold cursor-pointer">
                              {tBilling('onlinePayment') || 'Online Payment'}
                            </Label>
                            {paymentMethods.online_payment ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t('paymentProviderSettings.enabled') || 'Enabled'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800">
                                {t('paymentProviderSettings.disabled') || 'Disabled'}
                              </Badge>
                            )}
                            {isFreePlan && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                                <Lock className="h-3 w-3 mr-1" />
                                {t('paymentProviderSettings.requiresUpgrade') || 'Requires Upgrade'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {isFreePlan 
                              ? (t('paymentProviderSettings.onlinePaymentFreePlanDescription') || 
                                 'Upgrade to Standard or Pro plan to enable online payments')
                              : (t('paymentProviderSettings.onlinePaymentDescription') || 
                                 'Accept online payments via payment gateway (FPX, credit card, e-wallet)')}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {isOnlinePaymentOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-blue-50/50 dark:bg-blue-950/30 p-6">
                      <div className="space-y-4">
                        {/* Upgrade Notice for Free Plan */}
                        {isFreePlan && (
                          <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <AlertDescription className="text-amber-800 dark:text-amber-200">
                              <strong>{t('paymentProviderSettings.onlinePaymentRequiresUpgrade') || 'Online payment requires Standard or Pro plan'}</strong>
                              <p className="mt-1 text-sm">
                                {t('paymentProviderSettings.onlinePaymentFreePlanDescription') || 
                                 'Upgrade to Standard or Pro plan to enable and save online payment settings.'}
                              </p>
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between pb-4 border-b">
                          <div className="space-y-1">
                            <Label className="text-base font-semibold">
                              {t('paymentProviderSettings.status') || 'Status'}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {t('paymentProviderSettings.enableOnlineDonationsDescription') || 
                               'Allow members to pay contributions online to your mosque'}
                            </p>
                          </div>
                          <Switch
                            checked={paymentMethods.online_payment}
                            onCheckedChange={(checked) => handlePaymentMethodToggle('online_payment', checked)}
                            disabled={savingPaymentMethods || isFreePlan}
                          />
                        </div>

                        {/* Fixed Price for Online Payment */}
                        <div className="space-y-2">
                          <Label htmlFor="khairat-fixed-price-online">
                            {t('paymentProviderSettings.fixedPrice') || 'Fixed Price (RM)'}
                          </Label>
                          <Input
                            id="khairat-fixed-price-online"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={khairatFixedPrices.online_payment?.toString() || ''}
                            onChange={(e) => 
                              setKhairatFixedPrices(prev => ({ 
                                ...prev,
                                online_payment: parseFloat(e.target.value) || undefined
                              }))
                            }
                            onBlur={() => handleKhairatPricesSave('online_payment')}
                            disabled={isFreePlan}
                            className={isFreePlan ? "bg-slate-50 dark:bg-slate-800 cursor-not-allowed" : ""}
                          />
                          <p className="text-xs text-muted-foreground">
                            {t('paymentProviderSettings.fixedPriceHint') || 
                             'Leave empty to allow any amount. If set, this will be the fixed amount for online payments.'}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold mb-2">
                            {t('paymentProviderSettings.paymentProvider') || 'Payment Gateway Configuration'}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-4">
                            {t('paymentProviderSettings.enableOnlineDonationsDescription') || 
                             'Configure your payment gateway to accept online payments'}
                          </p>
                        </div>
                        <div className={isFreePlan ? "opacity-50 pointer-events-none" : ""}>
                          <PaymentProviderSettings />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Bank Transfer with Inline Configuration */}
              <Collapsible 
                open={isBankTransferOpen} 
                onOpenChange={setIsBankTransferOpen}
                className="space-y-4"
              >
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-4 flex-1 cursor-pointer">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold cursor-pointer">
                              {tBilling('bankTransfer') || 'Bank Transfer'}
                            </Label>
                            {paymentMethods.bank_transfer ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t('paymentProviderSettings.enabled') || 'Enabled'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800">
                                {t('paymentProviderSettings.disabled') || 'Disabled'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('paymentProviderSettings.bankTransferDescription') || 
                             'Members can transfer directly to your mosque bank account. Payments require manual approval.'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {isBankTransferOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-emerald-50/50 dark:bg-emerald-950/30 p-6">
                      <div className="space-y-4">
                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between pb-4 border-b">
                          <div className="space-y-1">
                            <Label className="text-base font-semibold">
                              Status
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {t('paymentProviderSettings.bankTransferDescription') || 
                               'Members can transfer directly to your mosque bank account. Payments require manual approval.'}
                            </p>
                          </div>
                          <Switch
                            checked={paymentMethods.bank_transfer}
                            onCheckedChange={(checked) => handlePaymentMethodToggle('bank_transfer', checked)}
                            disabled={savingPaymentMethods}
                          />
                        </div>

                            <div>
                              <h4 className="text-sm font-semibold mb-2">
                                {t('paymentProviderSettings.bankTransferDetails') || 'Bank Account Details'}
                              </h4>
                              <p className="text-xs text-muted-foreground mb-4">
                                {t('paymentProviderSettings.bankTransferDetailsDescription') || 
                                 'Enter your mosque bank account details. This information will be shown to members when they choose bank transfer payment.'}
                              </p>
                            </div>
                            
                            <div className="grid gap-4">
                              {/* Fixed Price for Bank Transfer */}
                              <div className="space-y-2">
                                <Label htmlFor="khairat-fixed-price-bank">
                                  {t('paymentProviderSettings.fixedPrice') || 'Fixed Price (RM)'}
                                </Label>
                                <Input
                                  id="khairat-fixed-price-bank"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={khairatFixedPrices.bank_transfer?.toString() || ''}
                                  onChange={(e) => 
                                    setKhairatFixedPrices(prev => ({ 
                                      ...prev,
                                      bank_transfer: parseFloat(e.target.value) || undefined
                                    }))
                                  }
                                  onBlur={() => handleKhairatPricesSave('bank_transfer')}
                                />
                                <p className="text-xs text-muted-foreground">
                                  {t('paymentProviderSettings.fixedPriceHint') || 
                                   'Leave empty to allow any amount. If set, this will be the fixed amount for bank transfer payments.'}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="bank_name">
                                  {t('paymentProviderSettings.bankName') || 'Bank Name'} *
                                </Label>
                                <Input
                                  id="bank_name"
                                  value={bankTransferDetails.bank_name}
                                  onChange={(e) => setBankTransferDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                                  placeholder={t('paymentProviderSettings.enterBankName') || 'e.g., Maybank, CIMB, Public Bank'}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="account_number">
                                  {t('paymentProviderSettings.accountNumber') || 'Account Number'} *
                                </Label>
                                <Input
                                  id="account_number"
                                  value={bankTransferDetails.account_number}
                                  onChange={(e) => setBankTransferDetails(prev => ({ ...prev, account_number: e.target.value }))}
                                  placeholder={t('paymentProviderSettings.enterAccountNumber') || 'Enter account number'}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="account_holder_name">
                                  {t('paymentProviderSettings.accountHolderName') || 'Account Holder Name'}
                                </Label>
                                <Input
                                  id="account_holder_name"
                                  value={bankTransferDetails.account_holder_name}
                                  onChange={(e) => setBankTransferDetails(prev => ({ ...prev, account_holder_name: e.target.value }))}
                                  placeholder={t('paymentProviderSettings.enterAccountHolderName') || 'Name as shown on bank account'}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="reference_instructions">
                                  {t('paymentProviderSettings.referenceInstructions') || 'Reference/Notes Instructions'}
                                </Label>
                                <Textarea
                                  id="reference_instructions"
                                  value={bankTransferDetails.reference_instructions}
                                  onChange={(e) => setBankTransferDetails(prev => ({ ...prev, reference_instructions: e.target.value }))}
                                  placeholder={t('paymentProviderSettings.enterReferenceInstructions') || 'Instructions for members on what to include in the transfer reference/notes (e.g., "Please include your name and IC number in the reference")'}
                                  rows={3}
                                />
                                <p className="text-xs text-muted-foreground">
                                  {t('paymentProviderSettings.referenceInstructionsHint') || 
                                   'Tell members what information to include when making the transfer (e.g., name, IC number, payment purpose)'}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <Button 
                                onClick={handleBankDetailsSave} 
                                disabled={savingBankDetails || !bankTransferDetails.bank_name || !bankTransferDetails.account_number}
                                size="sm"
                              >
                                {savingBankDetails ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('paymentProviderSettings.saving') || 'Saving...'}
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t('paymentProviderSettings.saveBankDetails') || 'Save Bank Details'}
                                  </>
                                )}
                              </Button>
                            </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
              </Collapsible>

              {/* Cash with Inline Configuration */}
              <Collapsible 
                open={isCashOpen} 
                onOpenChange={setIsCashOpen}
                className="space-y-4"
              >
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-4 flex-1 cursor-pointer">
                        <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                          <Banknote className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-base font-semibold cursor-pointer">
                              {tBilling('cash') || 'Cash'}
                            </Label>
                            {paymentMethods.cash ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t('paymentProviderSettings.enabled') || 'Enabled'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800">
                                {t('paymentProviderSettings.disabled') || 'Disabled'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('paymentProviderSettings.cashDescription') || 
                             'Members can pay in person at the mosque. Payments require manual recording and approval.'}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {isCashOpen ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent>
                    <div className="border-t bg-amber-50/50 dark:bg-amber-950/30 p-6">
                      <div className="space-y-4">
                        {/* Enable/Disable Toggle */}
                        <div className="flex items-center justify-between pb-4 border-b">
                          <div className="space-y-1">
                            <Label className="text-base font-semibold">
                              Status
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {t('paymentProviderSettings.cashDescription') || 
                               'Members can pay in person at the mosque. Payments require manual recording and approval.'}
                            </p>
                          </div>
                          <Switch
                            checked={paymentMethods.cash}
                            onCheckedChange={(checked) => handlePaymentMethodToggle('cash', checked)}
                            disabled={savingPaymentMethods}
                          />
                        </div>

                          <div>
                            <h4 className="text-sm font-semibold mb-2">
                              {t('paymentProviderSettings.cashPaymentDetails') || 'Cash Payment Details'}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-4">
                              {t('paymentProviderSettings.cashPaymentDetailsDescription') || 
                               'Enter information about where and when members can make cash payments. This information will be shown to members when they choose cash payment.'}
                            </p>
                          </div>
                          
                          <div className="grid gap-4">
                            {/* Fixed Price for Cash */}
                            <div className="space-y-2">
                              <Label htmlFor="khairat-fixed-price-cash">
                                {t('paymentProviderSettings.fixedPrice') || 'Fixed Price (RM)'}
                              </Label>
                              <Input
                                id="khairat-fixed-price-cash"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={khairatFixedPrices.cash?.toString() || ''}
                                onChange={(e) => 
                                  setKhairatFixedPrices(prev => ({ 
                                    ...prev,
                                    cash: parseFloat(e.target.value) || undefined
                                  }))
                                }
                                onBlur={() => handleKhairatPricesSave('cash')}
                              />
                              <p className="text-xs text-muted-foreground">
                                {t('paymentProviderSettings.fixedPriceHint') || 
                                 'Leave empty to allow any amount. If set, this will be the fixed amount for cash payments.'}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="payment_location">
                                {t('paymentProviderSettings.paymentLocation') || 'Payment Location'} *
                              </Label>
                              <Input
                                id="payment_location"
                                value={cashDetails.payment_location}
                                onChange={(e) => setCashDetails(prev => ({ ...prev, payment_location: e.target.value }))}
                                placeholder={t('paymentProviderSettings.enterPaymentLocation') || 'e.g., Masjid Jamek, Office Hours: 9am-5pm'}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="office_hours">
                                {t('paymentProviderSettings.officeHours') || 'Office Hours'}
                              </Label>
                              <Input
                                id="office_hours"
                                value={cashDetails.office_hours}
                                onChange={(e) => setCashDetails(prev => ({ ...prev, office_hours: e.target.value }))}
                                placeholder={t('paymentProviderSettings.enterOfficeHours') || 'e.g., Monday-Friday: 9:00 AM - 5:00 PM'}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="contact_person">
                                  {t('paymentProviderSettings.contactPerson') || 'Contact Person'}
                                </Label>
                                <Input
                                  id="contact_person"
                                  value={cashDetails.contact_person}
                                  onChange={(e) => setCashDetails(prev => ({ ...prev, contact_person: e.target.value }))}
                                  placeholder={t('paymentProviderSettings.enterContactPerson') || 'e.g., Ustaz Ahmad'}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="contact_phone">
                                  {t('paymentProviderSettings.contactPhone') || 'Contact Phone'}
                                </Label>
                                <Input
                                  id="contact_phone"
                                  value={cashDetails.contact_phone}
                                  onChange={(e) => setCashDetails(prev => ({ ...prev, contact_phone: e.target.value }))}
                                  placeholder={t('paymentProviderSettings.enterContactPhone') || 'e.g., +60123456789'}
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="cash_instructions">
                                {t('paymentProviderSettings.cashInstructions') || 'Payment Instructions'}
                              </Label>
                              <Textarea
                                id="cash_instructions"
                                value={cashDetails.instructions}
                                onChange={(e) => setCashDetails(prev => ({ ...prev, instructions: e.target.value }))}
                                placeholder={t('paymentProviderSettings.cashInstructionsPlaceholder') || 'e.g., Please bring exact amount. Receipt will be provided upon payment.'}
                                rows={3}
                              />
                              <p className="text-xs text-muted-foreground">
                                {t('paymentProviderSettings.cashInstructionsHint') || 
                                 'Provide any additional instructions for members making cash payments'}
                              </p>
                            </div>
                            
                            <div className="flex justify-end pt-2">
                              <Button 
                                onClick={handleCashDetailsSave} 
                                disabled={savingCashDetails || !cashDetails.payment_location}
                                size="sm"
                              >
                                {savingCashDetails ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('paymentProviderSettings.saving') || 'Saving...'}
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t('paymentProviderSettings.saveCashDetails') || 'Save Cash Details'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>


    </div>
  );
}

export default function PaymentSettingsPage() {
  const t = useTranslations('khairat');
  
  return (
    <ProtectedRoute>
      <DashboardLayout title={t('paymentGatewaySetup')}>
        <PaymentSettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
