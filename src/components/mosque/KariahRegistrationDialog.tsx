import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, UserCheck, X } from 'lucide-react';
import { KariahRegistrationInfo } from '@/components/mosque/KariahRegistrationInfo';
import { useTranslations } from 'next-intl';

export interface KariahRegistrationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'withdrawn' | null;
	adminNotes?: string | null;
	mosqueId: string;
	mosqueName?: string | null;
	isApplying: boolean;
	isWithdrawingApplication: boolean;
	isDeletingApplication: boolean;
	isWithdrawingMembership: boolean;
	onApply: () => void;
	onWithdrawApplication: () => void;
	onDeleteApplication: () => void;
	onWithdrawMembership: () => void;
}

export function KariahRegistrationDialog(props: KariahRegistrationDialogProps) {
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

	// Inline confirmation toggles
	const [confirming, setConfirming] = useState<null | 'withdrawApp' | 'deleteApp' | 'withdrawMember'>(null);

	const renderStatusBadge = () => {
		const getStatusInfo = () => {
			switch (status) {
				case 'active':
					return {
						title: t('membershipActive', { fallback: 'Active Member' }),
						description: t('membershipActiveDescription', { fallback: 'You are an active member of this mosque\'s Kariah program.' }),
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
						description: t('applicationApprovedDescription', { fallback: 'Your application has been approved. You are now a member of the Kariah program.' }),
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
						description: t('noApplicationDescription', { fallback: 'You have not applied for Kariah membership yet.' }),
						icon: <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
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
			return null; // No action buttons for pending status
		}

		// Rejected applications
		if (status === 'rejected') {
			return null;
		}

		// Withdrawn applications
		if (status === 'withdrawn') {
			return null;
		}

		// No application yet
		return (
			<Button onClick={onApply} disabled={isApplying} className="w-full bg-emerald-600 hover:bg-emerald-700">
				{isApplying ? (
					<>
						<Clock className="h-4 w-4 mr-2 animate-spin" />
						{t('submitting')}
					</>
				) : (
					<>
						<UserCheck className="h-4 w-4 mr-2" />
						{t('applyKariah')}
					</>
				)}
			</Button>
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<UserCheck className="h-5 w-5 text-emerald-600" />
						{t('applyKariah')}
					</DialogTitle>
					<DialogDescription>
						{t('joinKariahCommunity', { mosqueName: mosqueName || '' })}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 pb-4">
					{status ? renderStatusBadge() : <KariahRegistrationInfo mosqueId={mosqueId} />}
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
