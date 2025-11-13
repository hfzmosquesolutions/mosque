'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function MembersPage() {
  const t = useTranslations('docs.adminMembers');

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
              <h2 className="text-2xl font-semibold mb-4">{t('kariahApplications')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('reviewingApplications')}</h3>
                  <p className="mb-3">
                    {t('reviewingDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('reviewItem1')}</li>
                    <li>{t('reviewItem2')}</li>
                    <li>{t('reviewItem3')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>{t('reviewDetail1')}</li>
                        <li>{t('reviewDetail2')}</li>
                        <li>{t('reviewDetail3')}</li>
                        <li>{t('reviewDetail4')}</li>
                      </ul>
                    </li>
                    <li>{t('reviewItem4')}</li>
                    <li>{t('reviewItem5')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('applicationCriteria')}</h4>
                  <p className="text-sm mb-2">{t('criteriaDesc')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('criteriaItem1')}</li>
                    <li>{t('criteriaItem2')}</li>
                    <li>{t('criteriaItem3')}</li>
                    <li>{t('criteriaItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('bulkProcessing')}</h3>
                  <p className="mb-3">
                    {t('bulkDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('bulkItem1')}</li>
                    <li>{t('bulkItem2')}</li>
                    <li>{t('bulkItem3')}</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('activeMembers')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('viewingMembers')}</h3>
                  <p className="mb-3">
                    {t('viewingDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('viewItem1')}</li>
                    <li>{t('viewItem2')}</li>
                    <li>{t('viewItem3')}</li>
                    <li>{t('viewItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('memberDetails')}</h3>
                  <p className="mb-3">
                    {t('detailsDesc')}
                  </p>
                  <div className="space-y-2 ml-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('detailPersonal')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('detailHistory')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('detailContributions')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('detailApplications')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('detailClaims')}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('managingStatus')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('memberStatuses')}</h3>
                  <div className="space-y-2 ml-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('statusActive')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('statusInactive')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('statusSuspended')}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('updatingStatus')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('updateItem1')}</li>
                    <li>{t('updateItem2')}</li>
                    <li>{t('updateItem3')}</li>
                    <li>{t('updateItem4')}</li>
                    <li>{t('updateItem5')}</li>
                    <li>{t('updateItem6')}</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('memberStatistics')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('statsDesc')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('statTotal')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('statTotalDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('statNew')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('statNewDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('statPending')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('statPendingDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('statGrowth')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('statGrowthDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('exportingData')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('exportDesc')}
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>{t('exportItem1')}</li>
                  <li>{t('exportItem2')}</li>
                  <li>{t('exportItem3')}</li>
                  <li>{t('exportItem4')}</li>
                  <li>{t('exportItem5')}</li>
                </ol>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('dataPrivacy')}</h4>
                  <p className="text-sm">
                    {t('privacyDesc')}
                  </p>
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
