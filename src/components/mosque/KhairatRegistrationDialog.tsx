import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, Heart, X, Plus, Users } from 'lucide-react';
import { KhairatRegistrationInfo } from '@/components/mosque/KhairatRegistrationInfo';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, getUserDependents } from '@/lib/api';
import { UserProfile, UserDependent } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isValidMalaysiaIc, normalizeMalaysiaIc } from '@/lib/utils';

export interface KhairatRegistrationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
    status: 'approved' | 'active' | 'pending' | 'withdrawn' | 'rejected' | 'inactive' | null;
	adminNotes?: string | null;
	mosqueId: string;
	mosqueName?: string | null;
	isApplying: boolean;
	isWithdrawingApplication: boolean;
	isDeletingApplication: boolean;
	isWithdrawingMembership: boolean;
	onApply: (data: {
		full_name: string;
		ic_passport_number: string;
		phone?: string;
		email?: string;
		address?: string;
		application_reason?: string;
		dependents?: Array<{
			full_name: string;
			relationship: string;
			ic_passport_number?: string;
			date_of_birth?: string;
			gender?: string;
			phone?: string;
			email?: string;
			address?: string;
		}>;
	}) => void;
	onWithdrawApplication: () => void;
	onDeleteApplication: () => void;
	onWithdrawMembership: () => void;
}

export function KhairatRegistrationDialog(props: KhairatRegistrationDialogProps) {
	const {
		isOpen,
		onOpenChange,
		status,
		adminNotes,
		mosqueId,
		mosqueName,
		isApplying,
		isWithdrawingApplication,
		isDeletingApplication,
		isWithdrawingMembership,
		onApply,
		onWithdrawApplication,
		onDeleteApplication,
		onWithdrawMembership,
	} = props;

	const t = useTranslations('mosquePage');
	const { user } = useAuth();
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [userDependents, setUserDependents] = useState<UserDependent[]>([]);
	const [selectedDependentIds, setSelectedDependentIds] = useState<Set<string>>(new Set());
	const [showAddDependent, setShowAddDependent] = useState(false);
	const [newDependent, setNewDependent] = useState({
		full_name: '',
		relationship: '',
		ic_passport_number: '',
		date_of_birth: '',
		gender: 'male',
		phone: '',
		email: '',
		address: '',
	});

	// Inline confirmation toggles
	const [confirming, setConfirming] = useState<null | 'withdrawApp' | 'deleteApp'>(null);
	
	// Form state for application
	const [formData, setFormData] = useState({
		full_name: '',
		ic_passport_number: '',
		phone: '',
		email: '',
		address: '',
		application_reason: '',
	});

	// Fetch user profile and dependents when dialog opens
	useEffect(() => {
		if (isOpen && user?.id && !status) {
			let isMounted = true;
			
			const fetchProfileAndInitialize = async () => {
				// Fetch profile
				const profileResponse = await getUserProfile(user.id);
				if (!isMounted) return;
				
				// Fetch dependents
				const dependentsResponse = await getUserDependents(user.id);
				if (!isMounted) return;
				
				if (profileResponse.success && profileResponse.data) {
					setUserProfile(profileResponse.data);
					// Initialize form with fetched data
					setFormData({
						full_name: profileResponse.data.full_name || '',
						ic_passport_number: profileResponse.data.ic_passport_number 
              ? normalizeMalaysiaIc(profileResponse.data.ic_passport_number).slice(0, 12)
              : '',
						phone: profileResponse.data.phone || '',
						email: user.email || '',
						address: profileResponse.data.address || '',
						application_reason: '',
					});
				} else {
					// Even if profile fetch fails, initialize with user email
					setFormData({
						full_name: '',
						ic_passport_number: '',
						phone: '',
						email: user.email || '',
						address: '',
						application_reason: '',
					});
				}
				
				if (dependentsResponse.success && dependentsResponse.data) {
					setUserDependents(dependentsResponse.data);
				}
			};
			
			fetchProfileAndInitialize();
			
			return () => {
				isMounted = false;
			};
		} else if (!isOpen) {
			// Reset form when dialog closes
			setFormData({
				full_name: '',
				ic_passport_number: '',
				phone: '',
				email: '',
				address: '',
				application_reason: '',
			});
			setUserProfile(null);
			setUserDependents([]);
			setSelectedDependentIds(new Set());
			setShowAddDependent(false);
			setNewDependent({
				full_name: '',
				relationship: '',
				ic_passport_number: '',
				date_of_birth: '',
				gender: 'male',
				phone: '',
				email: '',
				address: '',
			});
		}
	}, [isOpen, user?.id, user?.email, status]);

	const renderStatusBadge = () => {
		const getStatusInfo = () => {
			switch (status) {
				case 'active':
					return {
						title: t('membershipActive', { fallback: 'Active Member' }),
						description: t('membershipActiveDescription', { fallback: 'You are an active member of this mosque\'s Khairat program.' }),
						icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
						bgColor: 'bg-green-100 dark:bg-green-900/30',
						iconBg: 'bg-green-100 dark:bg-green-900/30'
					};
				case 'inactive':
					return {
						title: t('membershipInactive', { fallback: 'Inactive Member' }),
						description: t('membershipInactiveDescription', { fallback: 'Your membership is currently inactive. Contact the mosque admin to reactivate.' }),
						icon: <X className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
						bgColor: 'bg-orange-100 dark:bg-orange-900/30',
						iconBg: 'bg-orange-100 dark:bg-orange-900/30'
					};
				case 'pending':
					return {
						title: t('applicationPending', { fallback: 'Application Pending' }),
						description: t('applicationPendingDescription', { fallback: 'Your application is under review. You will be notified once a decision is made.' }),
						icon: <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
						bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
						iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
					};
				case 'approved':
					return {
						title: t('applicationApproved', { fallback: 'Application Approved' }),
						description: t('applicationApprovedDescription', { fallback: 'Your application has been approved. You are now a member of the Khairat program.' }),
						icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
						bgColor: 'bg-green-100 dark:bg-green-900/30',
						iconBg: 'bg-green-100 dark:bg-green-900/30'
					};
				case 'rejected':
					return {
						title: t('applicationRejected', { fallback: 'Application Rejected' }),
						description: t('applicationRejectedDescription', { fallback: 'Your application was not approved. You can reapply if needed.' }),
						icon: <X className="h-5 w-5 text-red-600 dark:text-red-400" />,
						bgColor: 'bg-red-100 dark:bg-red-900/30',
						iconBg: 'bg-red-100 dark:bg-red-900/30'
					};
				case 'withdrawn':
					return {
						title: t('applicationWithdrawn', { fallback: 'Application Withdrawn' }),
						description: t('applicationWithdrawnDescription', { fallback: 'You have withdrawn your application. You can apply again if needed.' }),
						icon: <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />,
						bgColor: 'bg-gray-100 dark:bg-gray-900/30',
						iconBg: 'bg-gray-100 dark:bg-gray-900/30'
					};
				default:
					return {
						title: t('noApplication', { fallback: 'No Application' }),
						description: t('noApplicationDescription', { fallback: 'You have not applied for Khairat membership yet.' }),
						icon: <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
						bgColor: 'bg-blue-100 dark:bg-blue-900/30',
						iconBg: 'bg-blue-100 dark:bg-blue-900/30'
					};
			}
		};

		const statusInfo = getStatusInfo();

		return (
			<div className={`${statusInfo.bgColor} rounded-lg p-4 border border-slate-200 dark:border-slate-700`}>
				<div className="flex items-center gap-3 mb-3">
					<div className={`w-8 h-8 rounded-full flex items-center justify-center ${statusInfo.iconBg}`}>
						{statusInfo.icon}
					</div>
					<div className="flex-1">
						<h4 className="font-medium text-slate-900 dark:text-white">
							{statusInfo.title}
						</h4>
						<p className="text-sm text-slate-600 dark:text-slate-400">
							{statusInfo.description}
						</p>
					</div>
				</div>
				{status === 'rejected' && adminNotes && (
					<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-3">
						<h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">{t('adminNotes')}:</h5>
						<p className="text-sm text-red-700 dark:text-red-300">{adminNotes}</p>
					</div>
				)}
			</div>
		);
	};

	const renderActions = () => {
		// Active members
		if (status === 'active') {
			return null;
		}

		// Inactive members
		if (status === 'inactive') {
			return null;
		}

		// Approved applications
		if (status === 'approved') {
			return null;
		}

		// Pending applications
		if (status === 'pending') {
			return null;
		}

		// Rejected applications
		if (status === 'rejected') {
			return null;
		}

		// Withdrawn applications
		if (status === 'withdrawn') {
			return null;
		}

		// No application yet - show form
		return (
			<div className="space-y-4">
				<div className="space-y-3">
					<div>
						<Label htmlFor="full_name">Full Name *</Label>
						<Input
							id="full_name"
							value={formData.full_name}
							onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
							placeholder="Enter your full name"
							className="mt-1"
							required
						/>
					</div>
					<div>
						<Label htmlFor="ic_passport_number">IC Number *</Label>
						<Input
							id="ic_passport_number"
							value={formData.ic_passport_number}
							onChange={(e) => {
								const normalized = normalizeMalaysiaIc(e.target.value).slice(0, 12);
								setFormData({ ...formData, ic_passport_number: normalized });
							}}
							placeholder="Enter IC number"
							className="mt-1"
							maxLength={12}
							required
						/>
					</div>
					<div>
						<Label htmlFor="phone">Phone Number</Label>
						<Input
							id="phone"
							type="tel"
							value={formData.phone}
							onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
							placeholder="Enter phone number"
							className="mt-1"
						/>
					</div>
					<div>
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={formData.email}
							disabled
							className="mt-1 bg-slate-50 dark:bg-slate-800 cursor-not-allowed"
							placeholder="Email from your account"
						/>
					</div>
					<div>
						<Label htmlFor="address">Address</Label>
						<Textarea
							id="address"
							value={formData.address}
							onChange={(e) => setFormData({ ...formData, address: e.target.value })}
							placeholder="Enter your address"
							className="mt-1"
							rows={2}
						/>
					</div>
					<div>
						<Label htmlFor="application_reason">Application Reason (Optional)</Label>
						<Textarea
							id="application_reason"
							value={formData.application_reason}
							onChange={(e) => setFormData({ ...formData, application_reason: e.target.value })}
							placeholder="Why do you want to join the khairat program?"
							className="mt-1"
							rows={3}
						/>
					</div>
				</div>
				{/* Dependents Section */}
				{userDependents.length > 0 && (
					<div className="space-y-3 pt-4 border-t">
						<Label className="text-base font-semibold flex items-center gap-2">
							<Users className="h-4 w-4" />
							{t('includeDependents') || 'Include Tanggungan (Dependents)'}
						</Label>
						<p className="text-sm text-muted-foreground">
							{t('selectDependentsToInclude') || 'Select which dependents to include in your khairat registration'}
						</p>
						<div className="space-y-2 max-h-48 overflow-y-auto">
							{userDependents.map((dependent) => (
								<Card key={dependent.id} className="p-3">
									<div className="flex items-start gap-3">
										<Checkbox
											checked={selectedDependentIds.has(dependent.id)}
											onCheckedChange={(checked) => {
												const newSet = new Set(selectedDependentIds);
												if (checked) {
													newSet.add(dependent.id);
												} else {
													newSet.delete(dependent.id);
												}
												setSelectedDependentIds(newSet);
											}}
										/>
										<div className="flex-1">
											<p className="font-medium text-sm">{dependent.full_name}</p>
										<p className="text-xs text-muted-foreground">
											{dependent.relationship}
										</p>
										</div>
									</div>
								</Card>
							))}
						</div>
					</div>
				)}

				<Button 
					onClick={() => {
						if (!formData.full_name || !formData.ic_passport_number) {
							return;
						}

						if (!isValidMalaysiaIc(formData.ic_passport_number)) {
							// Basic guard; actual error feedback is shown via toast in parent handlers
							return;
						}
						
						// Prepare dependents data
						const selectedDependents = userDependents
							.filter(dep => selectedDependentIds.has(dep.id))
							.map(dep => ({
								full_name: dep.full_name,
								relationship: dep.relationship,
								date_of_birth: dep.date_of_birth || undefined,
								gender: dep.gender || undefined,
								phone: dep.phone || undefined,
								email: dep.email || undefined,
								address: dep.address || undefined,
							}));
						
						onApply({
							...formData,
							dependents: selectedDependents.length > 0 ? selectedDependents : undefined,
						});
					}} 
					disabled={isApplying || !formData.full_name || !formData.ic_passport_number} 
					className="w-full bg-emerald-600 hover:bg-emerald-700"
				>
					{isApplying ? (
						<>
							<Clock className="h-4 w-4 mr-2 animate-spin" />
							{t('submitting')}
						</>
					) : (
						<>
							<Heart className="h-4 w-4 mr-2" />
							{t('applyKhairat')}
						</>
					)}
				</Button>
			</div>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Heart className="h-5 w-5 text-emerald-600" />
						{t('applyKhairat')}
					</DialogTitle>
                    <DialogDescription>
                        {t('joinKhairatCommunity', { mosqueName: mosqueName || '' })}
                    </DialogDescription>
				</DialogHeader>

				<div className="space-y-4 pb-4">
					{status ? renderStatusBadge() : <KhairatRegistrationInfo mosqueId={mosqueId} />}
					{renderActions()}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
						{status === null ? t('cancel') : t('close')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
