'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function AboutPage() {
  const t = useTranslations('docs.about');
  
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
                {t('whatIsContent1')}
              </p>
              <p className="mb-4">
                {t('whatIsContent2')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('mission')}</h2>
              <p className="mb-4">
                {t('missionIntro')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('mission1')}</li>
                <li>{t('mission2')}</li>
                <li>{t('mission3')}</li>
                <li>{t('mission4')}</li>
                <li>{t('mission5')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('keyFeatures')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('forMembers')}</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('forMembers1')}</li>
                    <li>{t('forMembers2')}</li>
                    <li>{t('forMembers3')}</li>
                    <li>{t('forMembers4')}</li>
                    <li>{t('forMembers5')}</li>
                    <li>{t('forMembers6')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('forAdmins')}</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('forAdmins1')}</li>
                    <li>{t('forAdmins2')}</li>
                    <li>{t('forAdmins3')}</li>
                    <li>{t('forAdmins4')}</li>
                    <li>{t('forAdmins5')}</li>
                    <li>{t('forAdmins6')}</li>
                    <li>{t('forAdmins7')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('understandingKariah')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('understandingKariahContent1')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('understandingKariah1')}</li>
                  <li>{t('understandingKariah2')}</li>
                  <li>{t('understandingKariah3')}</li>
                  <li>{t('understandingKariah4')}</li>
                </ul>
                <p className="mb-3">
                  {t('understandingKariahContent2')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('understandingKhairat')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('understandingKhairatContent1')}
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>{t('understandingKhairat1')}</li>
                  <li>{t('understandingKhairat2')}</li>
                  <li>{t('understandingKhairat3')}</li>
                  <li>{t('understandingKhairat4')}</li>
                </ul>
                <p className="mb-3">
                  {t('understandingKhairatContent2')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('platformStatus')}</h2>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="mb-2">
                  {t('platformStatusContent1')}
                </p>
                <p className="text-sm">
                  {t('platformStatusContent2')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('gettingStarted')}</h2>
              <div className="space-y-3">
                <div className="p-4 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('forCommunityMembers')}</h4>
                  <p className="text-sm">
                    {t('forCommunityMembersContent')}
                  </p>
                </div>
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('forMosqueAdmins')}</h4>
                  <p className="text-sm">
                    {t('forMosqueAdminsContent')}
                  </p>
                </div>
              </div>
            </section>

            <section className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
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

