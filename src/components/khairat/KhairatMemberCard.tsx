'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type StatusVariant = 'default' | 'secondary' | 'outline';

export interface KhairatMemberCardProps {
  locale: string;
  title: string;
  memberName?: string | null;
  icNumber?: string | null; // unmasked IC (12 digits), will be masked inside
  memberId?: string | null;
  membershipNumber?: string | null;
  status?: string | null;
  // Optional helpers so each page can control masking if needed
  maskName?: (name: string) => string;
}

function getStatusVariant(status?: string | null): StatusVariant {
  if (!status) return 'outline';
  const normalized = status.toLowerCase();
  if (['active', 'approved', 'completed', 'paid'].includes(normalized)) return 'default';
  if (['pending', 'under_review', 'processing'].includes(normalized)) return 'secondary';
  if (['rejected', 'withdrawn', 'cancelled', 'inactive', 'suspended', 'failed'].includes(normalized)) {
    return 'secondary';
  }
  return 'outline';
}

function getStatusLabel(status: string | null | undefined, locale: string): string {
  if (!status) return locale === 'ms' ? 'Aktif' : 'Active';
  const normalized = status.toLowerCase();
  const fallbacks: Record<string, { ms: string; en: string }> = {
    active: { ms: 'Aktif', en: 'Active' },
    approved: { ms: 'Diluluskan', en: 'Approved' },
    inactive: { ms: 'Tidak Aktif', en: 'Inactive' },
    pending: { ms: 'Menunggu', en: 'Pending' },
    suspended: { ms: 'Digantung', en: 'Suspended' },
    under_review: { ms: 'Dalam Semakan', en: 'Under Review' },
    rejected: { ms: 'Ditolak', en: 'Rejected' },
    withdrawn: { ms: 'Ditarik balik', en: 'Withdrawn' },
    completed: { ms: 'Selesai', en: 'Completed' },
    failed: { ms: 'Gagal', en: 'Failed' },
    paid: { ms: 'Dibayar', en: 'Paid' },
    cancelled: { ms: 'Dibatalkan', en: 'Cancelled' },
  };
  const key = normalized as keyof typeof fallbacks;
  if (fallbacks[key]) {
    return locale === 'ms' ? fallbacks[key].ms : fallbacks[key].en;
  }
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function maskIc(ic?: string | null): string {
  if (!ic) return '';
  const normalized = ic.replace(/\D/g, '').slice(0, 12);
  if (normalized.length <= 6) return normalized;
  return normalized.slice(0, 6) + '******';
}

export function KhairatMemberCard({
  locale,
  title,
  memberName,
  icNumber,
  memberId,
  membershipNumber,
  status,
  maskName,
}: KhairatMemberCardProps) {
  const hasAnyInfo = memberName || icNumber || memberId || membershipNumber;
  if (!hasAnyInfo) return null;

  const displayName =
    memberName && maskName
      ? maskName(memberName)
      : memberName || '';

  const displayMemberId = membershipNumber || memberId?.slice(0, 8).toUpperCase();

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-emerald-100 to-emerald-50 dark:from-emerald-950/80 dark:via-emerald-900/40 dark:to-emerald-950/80 shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
        <div className="px-4 py-4 sm:px-5 sm:py-4">
          <div className="flex items-start gap-4">
            {/* Icon / avatar column */}
            <div className="mt-0.5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 shadow-inner ring-1 ring-emerald-100/80 dark:ring-emerald-800/60">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>

            {/* Details column */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-wide uppercase text-emerald-800 dark:text-emerald-200">
                  {title}
                </span>
                {status && (
                  <Badge
                    variant={getStatusVariant(status)}
                    className="capitalize bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950"
                  >
                    {getStatusLabel(status, locale)}
                  </Badge>
                )}
              </div>

              <div className="space-y-1.5">
                {displayName && (
                  <p className="text-sm text-slate-800 dark:text-slate-100">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {locale === 'ms' ? 'Nama Ahli' : 'Member Name'}:
                    </span>{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {displayName}
                    </span>
                  </p>
                )}
                {icNumber && (
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {locale === 'ms' ? 'Nombor IC' : 'IC Number'}:
                    </span>{' '}
                    <span className="font-mono font-semibold tracking-widest text-slate-900 dark:text-slate-50">
                      {maskIc(icNumber)}
                    </span>
                  </p>
                )}
                {displayMemberId && (
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {locale === 'ms' ? 'ID Ahli' : 'Member ID'}:
                    </span>{' '}
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-50">
                      {displayMemberId}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

