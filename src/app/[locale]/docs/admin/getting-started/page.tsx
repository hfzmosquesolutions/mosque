'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function AdminGettingStartedPage() {
  const t = useTranslations('docs.adminGettingStarted');
  
  return (
    <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('becomingAdmin')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('adminAccountSetup')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('setupItem1')}</li>
                    <li>{t('setupItem2')}</li>
                    <li>{t('setupItem3')}</li>
                    <li>{t('setupItem4')}</li>
                    <li>{t('setupItem5')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('verificationCode')}</h4>
                  <p className="text-sm">
                    {t('verificationCodeDesc')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('initialSetup')}</h2>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">1</span>
                    {t('checklist1Title')}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {t('checklist1Desc')}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {t('checklist1Action')}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm">2</span>
                    {t('checklist2Title')}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {t('checklist2Desc')}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {t('checklist2Action')}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">3</span>
                    {t('checklist3Title')}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {t('checklist3Desc')}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {t('checklist3Action')}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">4</span>
                    {t('checklist4Title')}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {t('checklist4Desc')}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {t('checklist4Action')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('understandingDashboard')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('dashboardDesc')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('statisticsCards')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                      <li>{t('statItem1')}</li>
                      <li>{t('statItem2')}</li>
                      <li>{t('statItem3')}</li>
                      <li>{t('statItem4')}</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('quickActions')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm text-slate-600 dark:text-slate-400">
                      <li>{t('actionItem1')}</li>
                      <li>{t('actionItem2')}</li>
                      <li>{t('actionItem3')}</li>
                      <li>{t('actionItem4')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('adminNavigation')}</h2>
              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navDashboard')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navDashboardDesc')}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navKhairat')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navKhairatDesc')}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navMosqueProfile')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navMosqueProfileDesc')}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('navBilling')}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('navBillingDesc')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('nextSteps')}</h2>
              <div className="space-y-3">
                <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('nextStep1Title')}</h4>
                  <p className="text-sm">
                    {t('nextStep1Content')}
                  </p>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('nextStep2Title')}</h4>
                  <p className="text-sm">
                    {t('nextStep2Content')}
                  </p>
                </div>
                <div className="p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('nextStep3Title')}</h4>
                  <p className="text-sm">
                    {t('nextStep3Content')}
                  </p>
                </div>
              </div>
            </section>

            <section className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
