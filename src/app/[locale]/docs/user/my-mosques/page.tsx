'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function MyMosquesPage() {
  const t = useTranslations('docs.myMosques');

  return (
    <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('findingMosques')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('browseAvailable')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('browseItem1')}</li>
                    <li>{t('browseItem2')}</li>
                    <li>{t('browseItem3')}</li>
                    <li>{t('browseItem4')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('mosqueProfileInfo')}</h4>
                  <p className="text-sm mb-2">{t('mosqueProfileInfoDesc')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('profileInfo1')}</li>
                    <li>{t('profileInfo2')}</li>
                    <li>{t('profileInfo3')}</li>
                    <li>{t('profileInfo4')}</li>
                    <li>{t('profileInfo5')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('joiningMosque')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('kariahApplication')}</h3>
                  <p className="mb-3">
                    {t('kariahApplicationDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('kariahItem1')}</li>
                    <li>{t('kariahItem2')}</li>
                    <li>{t('kariahItem3')}</li>
                    <li>{t('kariahItem4')}</li>
                    <li>{t('kariahItem5')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('applicationStatus')}</h4>
                  <p className="text-sm">
                    {t('applicationStatusDesc')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('managingMosques')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('viewingMemberships')}</h3>
                  <p className="mb-3">
                    {t('viewingMembershipsDesc')}
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-2">{t('myMosquesTab')}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('myMosquesTabDesc')}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-2">{t('applicationsTab')}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('applicationsTabDesc')}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-2">{t('paymentHistoryTab')}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('paymentHistoryTabDesc')}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-2">{t('claimsTab')}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('claimsTabDesc')}
                      </p>
                    </div>
                  </div>
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

