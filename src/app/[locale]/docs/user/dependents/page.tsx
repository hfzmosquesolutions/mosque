'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function DependentsPage() {
  const t = useTranslations('docs.dependents');
  
  return (
    <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('whatAre')}</h2>
              <p className="mb-4">
                {t('whatAreContent')}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('addingDependent')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('stepByStep')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('addItem1')}</li>
                    <li>{t('addItem2')}</li>
                    <li>{t('addItem3')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>{t('addFormItem1')}</li>
                        <li>{t('addFormItem2')}</li>
                        <li>{t('addFormItem3')}</li>
                        <li>{t('addFormItem4')}</li>
                        <li>{t('addFormItem5')}</li>
                        <li>{t('addFormItem6')}</li>
                      </ul>
                    </li>
                    <li>{t('addItem4')}</li>
                    <li>{t('addItem5')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('importantInfo')}</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('importantInfo1')}</li>
                    <li>{t('importantInfo2')}</li>
                    <li>{t('importantInfo3')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('managingDependents')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('viewingDependents')}</h3>
                  <p className="mb-3">
                    {t('viewingDependentsDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('viewingItem1')}</li>
                    <li>{t('viewingItem2')}</li>
                    <li>{t('viewingItem3')}</li>
                    <li>{t('viewingItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('editingDependents')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('editItem1')}</li>
                    <li>{t('editItem2')}</li>
                    <li>{t('editItem3')}</li>
                    <li>{t('editItem4')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('removingDependents')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('removeItem1')}</li>
                    <li>{t('removeItem2')}</li>
                    <li>{t('removeItem3')}</li>
                  </ol>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg mt-3">
                    <p className="text-sm">
                      <strong>{t('warning')}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('usingDependents')}</h2>
              <div className="space-y-4">
                <p className="mb-3">
                  {t('usingDependentsDesc')}
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('usingItem1')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('usingItem1Desc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('usingItem2')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('usingItem2Desc')}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold mb-2">{t('usingItem3')}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {t('usingItem3Desc')}
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
              </div>
            </section>
          </div>
        </DocLayout>
      </DocsLayout>
  );
}
