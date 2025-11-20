'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function KhairatPage() {
  const t = useTranslations('docs.khairat');
  
  return (
    <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('whatIs')}</h2>
              <p className="mb-4">
                {t('whatIsContent')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('makingContribution')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('stepByStep')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('contributionItem1')}</li>
                    <li>{t('contributionItem2')}</li>
                    <li>{t('contributionItem3')}</li>
                    <li>{t('contributionItem4')}</li>
                    <li>{t('contributionItem5')}</li>
                    <li>{t('contributionItem6')}</li>
                    <li>{t('contributionItem7')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('paymentMethods')}</h4>
                  <p className="text-sm mb-2">{t('paymentMethodsDesc')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('paymentMethod1')}</li>
                    <li>{t('paymentMethod2')}</li>
                    <li>{t('paymentMethod3')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('viewingHistory')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('viewingHistoryDesc')}
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('paymentDetails')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('paymentDetailsDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('legacyRecords')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('legacyRecordsDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('searchFilter')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('searchFilterDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('submittingClaim')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('submittingClaimDesc')}
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>{t('claimItem1')}</li>
                  <li>{t('claimItem2')}</li>
                  <li>{t('claimItem3')}
                    <ul className="list-disc list-inside ml-6 mt-2">
                      <li>{t('claimFormItem1')}</li>
                      <li>{t('claimFormItem2')}</li>
                      <li>{t('claimFormItem3')}</li>
                    </ul>
                  </li>
                  <li>{t('claimItem4')}</li>
                  <li>{t('claimItem5')}</li>
                </ol>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('claimReview')}</h4>
                  <p className="text-sm">
                    {t('claimReviewDesc')}
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
  );
}
