'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const t = useTranslations('docs.profile');
  
  return (
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
              <h2 className="text-2xl font-semibold mb-4">{t('personalInfo')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('updatingInfo')}</h3>
                  <p className="mb-3">{t('updatingInfoDesc')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('infoItem1')}</li>
                    <li>{t('infoItem2')}</li>
                    <li>{t('infoItem3')}</li>
                    <li>{t('infoItem4')}</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('profilePicture')}</h4>
                  <p className="text-sm">
                    {t('profilePictureDesc')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('accountDeletion')}</h2>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <h4 className="font-semibold mb-2">{t('deletingAccount')}</h4>
                <p className="text-sm mb-2">
                  {t('deletingAccountDesc')}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>{t('deletionItem1')}</li>
                  <li>{t('deletionItem2')}</li>
                  <li>{t('deletionItem3')}</li>
                  <li>{t('deletionItem4')}</li>
                </ul>
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
