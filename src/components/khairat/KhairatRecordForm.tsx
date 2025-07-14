'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthState } from '@/hooks/useAuth.v2';
import { useKhairat } from '@/hooks/useKhairat';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  X,
  Heart,
  AlertCircle,
  CheckCircle,
  Upload,
  FileText,
  Trash2,
} from 'lucide-react';
import {
  KhairatRecord,
  KhairatPaymentMethod,
  KhairatStatus,
} from '@/types/database';

interface KhairatRecordFormProps {
  recordId?: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface KhairatFormData {
  contributionAmount: number;
  paymentMethod: KhairatPaymentMethod;
  paymentDate: string;
  bankReference?: string;
  chequeNumber?: string;
  status: KhairatStatus;
  notes?: string;
  receiptNumber?: string;
  receiptFile?: File | null;
  receiptFileName?: string;
  selectedMosqueId?: string;
}

export function KhairatRecordForm({
  recordId,
  onClose,
  onSave,
}: KhairatRecordFormProps) {
  const { t } = useLanguage();
  const { user: authUser, profile } = useAuthState();
  const {
    records,
    canManageRecords,
    createRecord,
    updateRecord,
    uploadReceipt,
    settings,
    loadRecords,
    mosques,
  } = useKhairat();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<KhairatRecord | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState<KhairatFormData>({
    contributionAmount: 0,
    paymentMethod: 'cash',
    paymentDate: '',
    bankReference: '',
    chequeNumber: '',
    status: 'pending',
    notes: '',
    receiptNumber: '',
    receiptFile: null,
    receiptFileName: '',
    selectedMosqueId: profile?.mosque_id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data
  useEffect(() => {
    if (recordId) {
      // Load existing record data
      setIsLoading(true);
      const existingRecord = records.find((r) => r.id === recordId);
      if (existingRecord) {
        setCurrentRecord(existingRecord);
        setFormData({
          contributionAmount: existingRecord.contribution_amount,
          paymentMethod: existingRecord.payment_method,
          paymentDate: existingRecord.payment_date,
          bankReference: existingRecord.bank_reference || '',
          chequeNumber: existingRecord.cheque_number || '',
          status: existingRecord.status,
          notes: existingRecord.notes || '',
          receiptNumber: existingRecord.receipt_number || '',
          receiptFileName: existingRecord.receipt_file_name || '',
          selectedMosqueId: existingRecord.mosque_id,
        });
        setIsLoading(false);
      } else {
        // If not found in current records, we might need to fetch it
        loadRecords().then(() => {
          setIsLoading(false);
        });
      }
    } else {
      // New record - pre-fill with user data and defaults
      const defaultAmount = settings?.default_contribution_amount || 0;
      setFormData((prev) => ({
        ...prev,
        contributionAmount: defaultAmount,
        paymentDate: new Date().toISOString().split('T')[0],
      }));
    }
  }, [recordId, records, settings, loadRecords, profile]);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.contributionAmount || formData.contributionAmount <= 0) {
      newErrors.contributionAmount = t(
        'khairat.validation.contributionAmountRequired'
      );
    }

    // Check minimum amount if set
    if (
      settings?.minimum_contribution_amount &&
      formData.contributionAmount < settings.minimum_contribution_amount
    ) {
      newErrors.contributionAmount = t(
        'khairat.validation.contributionAmountTooLow'
      );
    }

    // Check maximum amount if set
    if (
      settings?.maximum_contribution_amount &&
      formData.contributionAmount > settings.maximum_contribution_amount
    ) {
      newErrors.contributionAmount = t(
        'khairat.validation.contributionAmountTooHigh'
      );
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = t('khairat.validation.paymentDateRequired');
    }

    if (!formData.selectedMosqueId) {
      newErrors.selectedMosqueId = t('khairat.validation.mosqueRequired');
    }

    if (
      formData.paymentMethod === 'bank_transfer' &&
      !formData.bankReference?.trim()
    ) {
      newErrors.bankReference = t('khairat.validation.bankReferenceRequired');
    }

    if (formData.paymentMethod === 'cheque' && !formData.chequeNumber?.trim()) {
      newErrors.chequeNumber = t('khairat.validation.chequeNumberRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('common.pleaseFixValidationErrors'));
      return;
    }

    setIsSaving(true);

    try {
      let savedRecord;

      if (recordId) {
        // Update existing record
        savedRecord = await updateRecord(recordId, {
          member_name: profile?.full_name || '',
          member_phone: profile?.phone || '',
          member_email: profile?.email || '',
          contribution_amount: formData.contributionAmount,
          payment_method: formData.paymentMethod,
          payment_date: formData.paymentDate,
          bank_reference: formData.bankReference,
          cheque_number: formData.chequeNumber,
          status: formData.status,
          notes: formData.notes,
          receipt_number: formData.receiptNumber,
        });
      } else {
        // Create new record
        savedRecord = await createRecord(
          {
            profile_id: profile?.id || '',
            member_name: profile?.full_name || '',
            member_phone: profile?.phone || '',
            member_email: profile?.email || '',
            contribution_amount: formData.contributionAmount,
            payment_method: formData.paymentMethod,
            payment_date: formData.paymentDate,
            bank_reference: formData.bankReference,
            cheque_number: formData.chequeNumber,
            status: formData.status,
            notes: formData.notes,
            receipt_number: formData.receiptNumber,
          },
          formData.selectedMosqueId || ''
        );
      }

      // Upload receipt file if present
      if (formData.receiptFile && savedRecord) {
        await uploadReceipt(formData.receiptFile, savedRecord.id);
      }

      // Show success toast
      toast.success(
        recordId
          ? t('khairat.recordUpdatedSuccess')
          : t('khairat.recordCreatedSuccess')
      );

      onSave(savedRecord);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save record';
      toast.error(errorMessage);
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof KhairatFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        const errorMessage = t('khairat.validation.invalidFileType');
        toast.error(errorMessage);
        setErrors((prev) => ({
          ...prev,
          receiptFile: errorMessage,
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        const errorMessage = t('khairat.validation.fileTooLarge');
        toast.error(errorMessage);
        setErrors((prev) => ({
          ...prev,
          receiptFile: errorMessage,
        }));
        return;
      }

      // File is valid, show success toast
      toast.success(t('khairat.fileUploadSuccess'));

      setFormData((prev) => ({
        ...prev,
        receiptFile: file,
        receiptFileName: file.name,
      }));

      // Clear any existing error
      if (errors.receiptFile) {
        setErrors((prev) => ({ ...prev, receiptFile: '' }));
      }
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setFormData((prev) => ({
      ...prev,
      receiptFile: null,
      receiptFileName: '',
    }));
  };

  const canManageStatus = canManageRecords;
  const isEditing = Boolean(recordId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">{t('common.loading')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onClose} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              {isEditing ? t('khairat.editRecord') : t('khairat.addRecord')}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditing
                ? t('khairat.editRecordDescription')
                : t('khairat.addRecordDescription')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </div>

      {/* Error display */}
      {errors.submit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{errors.submit}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mosque Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t('khairat.mosqueSelection')}</CardTitle>
            <CardDescription>
              {t('khairat.mosqueSelectionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="selectedMosqueId">{t('khairat.mosque')} *</Label>
              <Select
                value={formData.selectedMosqueId}
                onValueChange={(value) =>
                  handleInputChange('selectedMosqueId', value)
                }
              >
                <SelectTrigger
                  className={errors.selectedMosqueId ? 'border-red-500' : ''}
                >
                  <SelectValue
                    placeholder={t('khairat.selectMosquePlaceholder')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {mosques.map((mosque) => (
                    <SelectItem key={mosque.id} value={mosque.id}>
                      {mosque.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.selectedMosqueId && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.selectedMosqueId}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('khairat.paymentInformation')}</CardTitle>
            <CardDescription>
              {t('khairat.paymentInformationDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contributionAmount">
                  {t('khairat.contributionAmount')} *
                </Label>
                <Input
                  id="contributionAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.contributionAmount}
                  onChange={(e) =>
                    handleInputChange(
                      'contributionAmount',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                  className={errors.contributionAmount ? 'border-red-500' : ''}
                />
                {errors.contributionAmount && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.contributionAmount}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">
                  {t('khairat.paymentMethod')} *
                </Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value: KhairatPaymentMethod) =>
                    handleInputChange('paymentMethod', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      {t('khairat.paymentMethods.cash')}
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      {t('khairat.paymentMethods.bankTransfer')}
                    </SelectItem>
                    <SelectItem value="cheque">
                      {t('khairat.paymentMethods.cheque')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">{t('khairat.paymentDate')} *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) =>
                  handleInputChange('paymentDate', e.target.value)
                }
                className={errors.paymentDate ? 'border-red-500' : ''}
              />
              {errors.paymentDate && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.paymentDate}
                </p>
              )}
            </div>

            {/* Conditional fields based on payment method */}
            {formData.paymentMethod === 'bank_transfer' && (
              <div className="space-y-2">
                <Label htmlFor="bankReference">
                  {t('khairat.bankReference')} *
                </Label>
                <Input
                  id="bankReference"
                  value={formData.bankReference}
                  onChange={(e) =>
                    handleInputChange('bankReference', e.target.value)
                  }
                  placeholder={t('khairat.bankReferencePlaceholder')}
                  className={errors.bankReference ? 'border-red-500' : ''}
                />
                {errors.bankReference && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.bankReference}
                  </p>
                )}
              </div>
            )}

            {formData.paymentMethod === 'cheque' && (
              <div className="space-y-2">
                <Label htmlFor="chequeNumber">
                  {t('khairat.chequeNumber')} *
                </Label>
                <Input
                  id="chequeNumber"
                  value={formData.chequeNumber}
                  onChange={(e) =>
                    handleInputChange('chequeNumber', e.target.value)
                  }
                  placeholder={t('khairat.chequeNumberPlaceholder')}
                  className={errors.chequeNumber ? 'border-red-500' : ''}
                />
                {errors.chequeNumber && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.chequeNumber}
                  </p>
                )}
              </div>
            )}

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receiptFile">{t('khairat.receiptFile')}</Label>
              <div className="space-y-2">
                {formData.receiptFile || formData.receiptFileName ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <span className="text-sm font-medium">
                        {formData.receiptFile?.name || formData.receiptFileName}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="receiptFile"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">
                            {t('khairat.uploadReceipt')}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('khairat.uploadReceiptDescription')}
                        </p>
                      </div>
                      <input
                        id="receiptFile"
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              {errors.receiptFile && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.receiptFile}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status and Admin Fields */}
        {canManageStatus && (
          <Card>
            <CardHeader>
              <CardTitle>{t('khairat.statusManagement')}</CardTitle>
              <CardDescription>
                {t('khairat.statusManagementDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">{t('khairat.status')} *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: KhairatStatus) =>
                      handleInputChange('status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        {t('khairat.statuses.pending')}
                      </SelectItem>
                      <SelectItem value="approved">
                        {t('khairat.statuses.approved')}
                      </SelectItem>
                      <SelectItem value="paid">
                        {t('khairat.statuses.paid')}
                      </SelectItem>
                      <SelectItem value="rejected">
                        {t('khairat.statuses.rejected')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptNumber">
                    {t('khairat.receiptNumber')}
                  </Label>
                  <Input
                    id="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={(e) =>
                      handleInputChange('receiptNumber', e.target.value)
                    }
                    placeholder={t('khairat.receiptNumberPlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('khairat.additionalNotes')}</CardTitle>
            <CardDescription>
              {t('khairat.additionalNotesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('khairat.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder={t('khairat.notesPlaceholder')}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
