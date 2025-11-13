'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function AdminKhairatPage() {
  const t = useTranslations('docs.adminKhairat');

  return (
    <ProtectedRoute>
      <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('overview')}</h2>
              <p className="mb-4">
                {t('overviewDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('programsTab')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('creatingProgram')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('createItem1')}</li>
                    <li>{t('createItem2')}</li>
                    <li>{t('createItem3')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>{t('createFormItem1')}</li>
                        <li>{t('createFormItem2')}</li>
                        <li>{t('createFormItem3')}</li>
                        <li>{t('createFormItem4')}</li>
                        <li>{t('createFormItem5')}</li>
                      </ul>
                    </li>
                    <li>{t('createItem4')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('managingPrograms')}</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('manageItem1')}</li>
                    <li>{t('manageItem2')}</li>
                    <li>{t('manageItem3')}</li>
                    <li>{t('manageItem4')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('applicationsTab')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('reviewingApplications')}</h3>
                  <p className="mb-3">
                    {t('reviewingDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('reviewItem1')}</li>
                    <li>{t('reviewItem2')}</li>
                    <li>{t('reviewItem3')}</li>
                    <li>{t('reviewItem4')}</li>
                    <li>{t('reviewItem5')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('applicationStatus')}</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('statusPending')}</li>
                    <li>{t('statusApproved')}</li>
                    <li>{t('statusRejected')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('bulkActions')}</h3>
                  <p className="mb-3">
                    {t('bulkDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('bulkItem1')}</li>
                    <li>{t('bulkItem2')}</li>
                    <li>{t('bulkItem3')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('claimsTab')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('processingClaims')}</h3>
                  <p className="mb-3">
                    {t('processingDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('claimItem1')}</li>
                    <li>{t('claimItem2')}</li>
                    <li>{t('claimItem3')}</li>
                    <li>{t('claimItem4')}</li>
                    <li>{t('claimItem5')}</li>
                    <li>{t('claimItem6')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('claimWorkflow')}</h3>
                  <div className="space-y-2 ml-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('workflowPending')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('workflowReview')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('workflowApproved')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('workflowPaid')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('workflowRejected')}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('priorityLevels')}</h3>
                  <p className="mb-3">{t('priorityDesc')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('priorityHigh')}</li>
                    <li>{t('priorityMedium')}</li>
                    <li>{t('priorityLow')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('paymentsTab')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('viewingContributions')}</h3>
                  <p className="mb-3">
                    {t('contributionsDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('contribItem1')}</li>
                    <li>{t('contribItem2')}</li>
                    <li>{t('contribItem3')}</li>
                    <li>{t('contribItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('paymentStatus')}</h3>
                  <div className="space-y-2 ml-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('statusCompleted')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('statusPendingPay')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('statusFailed')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('statusCancelled')}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('manualEntry')}</h3>
                  <p className="mb-3">
                    {t('manualDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('manualItem1')}</li>
                    <li>{t('manualItem2')}</li>
                    <li>{t('manualItem3')}</li>
                    <li>{t('manualItem4')}</li>
                    <li>{t('manualItem5')}</li>
                    <li>{t('manualItem6')}</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('legacyDataTab')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('importingRecords')}</h3>
                  <p className="mb-3">
                    {t('importingDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('importItem1')}</li>
                    <li>{t('importItem2')}</li>
                    <li>{t('importItem3')}</li>
                    <li>{t('importItem4')}</li>
                    <li>{t('importItem5')}</li>
                    <li>{t('importItem6')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('matchingRecords')}</h3>
                  <p className="mb-3">
                    {t('matchingDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('matchItem1')}</li>
                    <li>{t('matchItem2')}</li>
                    <li>{t('matchItem3')}</li>
                    <li>{t('matchItem4')}</li>
                    <li>{t('matchItem5')}</li>
                    <li>{t('matchItem6')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('bulkMatching')}</h3>
                  <p className="mb-3">
                    {t('bulkMatchDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('bulkMatchItem1')}</li>
                    <li>{t('bulkMatchItem2')}</li>
                    <li>{t('bulkMatchItem3')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('csvRequirements')}</h4>
                  <p className="text-sm mb-2">{t('csvDesc')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('csvItem1')}</li>
                    <li>{t('csvItem2')}</li>
                    <li>{t('csvItem3')}</li>
                    <li>{t('csvItem4')}</li>
                    <li>{t('csvItem5')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('tips')}</h2>
              <div className="space-y-3">
                <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('tip1Title')}</h4>
                  <p className="text-sm">
                    {t('tip1Content')}
                  </p>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('tip2Title')}</h4>
                  <p className="text-sm">
                    {t('tip2Content')}
                  </p>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('tip3Title')}</h4>
                  <p className="text-sm">
                    {t('tip3Content')}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </DocLayout>
      </DocsLayout>
    </ProtectedRoute>
  );
}
