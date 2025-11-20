'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function GettingStartedPage() {
  const t = useTranslations('docs.gettingStarted');
  
  return (
    <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('creatingAccount')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('step1')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('step1Item1')}</li>
                    <li>{t('step1Item2')}</li>
                    <li>{t('step1Item3')}</li>
                    <li>{t('step1Item4')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('step2')}</h3>
                  <p className="mb-2">{t('step2Intro')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('step2Item1')}</li>
                    <li>{t('step2Item2')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li><strong>{t('step2Item2a')}</strong></li>
                        <li><strong>{t('step2Item2b')}</strong></li>
                      </ul>
                    </li>
                    <li>{t('step2Item3')}</li>
                    <li>{t('step2Item4')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('dashboard')}</h2>
              <p className="mb-4">
                {t('dashboardContent')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('dashboardItem1')}</li>
                <li>{t('dashboardItem2')}</li>
                <li>{t('dashboardItem3')}</li>
                <li>{t('dashboardItem4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('navigation')}</h2>
              <p className="mb-4">{t('navigationContent')}</p>
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navDashboard')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navDashboardDesc')}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navMyMosques')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navMyMosquesDesc')}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navContributions')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navContributionsDesc')}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navDependents')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navDependentsDesc')}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navProfile')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navProfileDesc')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('nextSteps')}</h2>
              <div className="space-y-3">
                <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('nextStep1')}</h4>
                  <p className="text-sm">
                    {t('nextStep1Content')}
                  </p>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('nextStep2')}</h4>
                  <p className="text-sm">
                    {t('nextStep2Content')}
                  </p>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('nextStep3')}</h4>
                  <p className="text-sm">
                    {t('nextStep3Content')}
                  </p>
                </div>
              </div>
            </section>

            <section className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h3 className="font-semibold mb-2">{t('needHelp')}</h3>
              <p className="text-sm">
                {t('needHelpContent')}
              </p>
            </section>
          </div>
        </DocLayout>
      </DocsLayout>
  );
}

