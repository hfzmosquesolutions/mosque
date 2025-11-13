'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function MosqueProfilePage() {
  const t = useTranslations('docs.adminMosqueProfile');
  
  return (
    <ProtectedRoute>
      <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('accessingProfile')}</h2>
              <p className="mb-4">
                {t('accessingProfileDesc')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('basicInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('requiredInfo')}</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('requiredItem1')}</li>
                    <li>{t('requiredItem2')}</li>
                    <li>{t('requiredItem3')}</li>
                    <li>{t('requiredItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('optionalInfo')}</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('optionalItem1')}</li>
                    <li>{t('optionalItem2')}</li>
                    <li>{t('optionalItem3')}</li>
                    <li>{t('optionalItem4')}</li>
                    <li>{t('optionalItem5')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('visualAssets')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('logo')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('logoItem1')}</li>
                    <li>{t('logoItem2')}</li>
                    <li>{t('logoItem3')}</li>
                    <li>{t('logoItem4')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('banner')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('bannerItem1')}</li>
                    <li>{t('bannerItem2')}</li>
                    <li>{t('bannerItem3')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('imageGuidelines')}</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('guideline1')}</li>
                    <li>{t('guideline2')}</li>
                    <li>{t('guideline3')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('servicesFeatures')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('servicesDesc')}
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('serviceKhairat')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('serviceKhairatDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('serviceKariah')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('serviceKariahDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('serviceOrg')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('serviceOrgDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('privacySettings')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('publicPrivate')}</h3>
                  <p className="mb-3">
                    {t('publicPrivateDesc')}
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-2">{t('publicProfile')}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('publicProfileDesc')}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <h4 className="font-semibold mb-2">{t('privateProfile')}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {t('privateProfileDesc')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('viewingPublic')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('viewingPublicDesc')}
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>{t('viewingItem1')}</li>
                  <li>{t('viewingItem2')}</li>
                  <li>{t('viewingItem3')}</li>
                  <li>{t('viewingItem4')}</li>
                </ol>
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
