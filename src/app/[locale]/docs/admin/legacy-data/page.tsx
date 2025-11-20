'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function LegacyDataPage() {
  const t = useTranslations('docs.adminLegacyData');

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
                {t('whatIsDesc')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('whatIsItem1')}</li>
                <li>{t('whatIsItem2')}</li>
                <li>{t('whatIsItem3')}</li>
                <li>{t('whatIsItem4')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('preparingData')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('csvFormat')}</h3>
                  <p className="mb-3">
                    {t('csvDesc')}
                  </p>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('requiredColumns')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>{t('reqCol1')}</li>
                      <li>{t('reqCol2')}</li>
                      <li>{t('reqCol3')}</li>
                      <li>{t('reqCol4')}</li>
                    </ul>
                    <h4 className="font-semibold mb-2 mt-4">{t('optionalColumns')}</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>{t('optCol1')}</li>
                      <li>{t('optCol2')}</li>
                      <li>{t('optCol3')}</li>
                      <li>{t('optCol4')}</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('dataQuality')}</h3>
                  <p className="mb-3">{t('qualityDesc')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('qualityItem1')}</li>
                    <li>{t('qualityItem2')}</li>
                    <li>{t('qualityItem3')}</li>
                    <li>{t('qualityItem4')}</li>
                    <li>{t('qualityItem5')}</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('sampleFormat')}</h4>
                  <pre className="text-xs bg-white dark:bg-slate-900 p-3 rounded overflow-x-auto">
{`IC/Passport,Name,Amount,Date,Program Name
123456789012,Ahmad bin Ali,100.00,2023-01-15,Khairat Program
987654321098,Siti binti Hassan,50.00,2023-02-20,General Fund`}
                  </pre>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('uploadingData')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('uploadProcess')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('uploadItem1')}</li>
                    <li>{t('uploadItem2')}</li>
                    <li>{t('uploadItem3')}</li>
                    <li>{t('uploadItem4')}</li>
                    <li>{t('uploadItem5')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>{t('previewItem1')}</li>
                        <li>{t('previewItem2')}</li>
                        <li>{t('previewItem3')}</li>
                      </ul>
                    </li>
                    <li>{t('uploadItem6')}</li>
                    <li>{t('uploadItem7')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('validation')}</h4>
                  <p className="text-sm">
                    {t('validationDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('validationItem1')}</li>
                    <li>{t('validationItem2')}</li>
                    <li>{t('validationItem3')}</li>
                    <li>{t('validationItem4')}</li>
                  </ul>
                  <p className="text-sm mt-2">
                    {t('validationNote')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('matchingRecords')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('individualMatching')}</h3>
                  <p className="mb-3">
                    {t('individualDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('indMatchItem1')}</li>
                    <li>{t('indMatchItem2')}</li>
                    <li>{t('indMatchItem3')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>{t('searchItem1')}</li>
                        <li>{t('searchItem2')}</li>
                        <li>{t('searchItem3')}</li>
                      </ul>
                    </li>
                    <li>{t('indMatchItem4')}</li>
                    <li>{t('indMatchItem5')}</li>
                    <li>{t('indMatchItem6')}</li>
                    <li>{t('indMatchItem7')}</li>
                    <li>{t('indMatchItem8')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('autoMatching')}</h3>
                  <p className="mb-3">
                    {t('autoDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('autoItem1')}</li>
                    <li>{t('autoItem2')}</li>
                    <li>{t('autoItem3')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('bulkMatching')}</h3>
                  <p className="mb-3">
                    {t('bulkMatchDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('bulkMatchItem1')}</li>
                    <li>{t('bulkMatchItem2')}</li>
                    <li>{t('bulkMatchItem3')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>{t('bulkProcessItem1')}</li>
                        <li>{t('bulkProcessItem2')}</li>
                        <li>{t('bulkProcessItem3')}</li>
                      </ul>
                    </li>
                    <li>{t('bulkMatchItem4')}</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('managingMatched')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('viewingMatched')}</h3>
                  <p className="mb-3">
                    {t('viewingMatchedDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('matchedItem1')}</li>
                    <li>{t('matchedItem2')}</li>
                    <li>{t('matchedItem3')}</li>
                    <li>{t('matchedItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('unmatchingRecords')}</h3>
                  <p className="mb-3">
                    {t('unmatchDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('unmatchItem1')}</li>
                    <li>{t('unmatchItem2')}</li>
                    <li>{t('unmatchItem3')}</li>
                    <li>{t('unmatchItem4')}</li>
                    <li>{t('unmatchItem5')}</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('statisticsReports')}</h2>
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
                    <h4 className="font-semibold mb-2">{t('statMatched')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('statMatchedDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('statUnmatched')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('statUnmatchedDesc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('statAmount')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('statAmountDesc')}
                    </p>
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
                <div className="p-4 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded">
                  <h4 className="font-semibold mb-2">{t('tip4Title')}</h4>
                  <p className="text-sm">
                    {t('tip4Content')}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </DocLayout>
      </DocsLayout>
  );
}
