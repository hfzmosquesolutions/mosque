'use client';

import { DocsLayout } from '@/components/layout/DocsLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DocLayout } from '@/components/docs/DocLayout';
import { useTranslations } from 'next-intl';

export default function PaymentsPage() {
  const t = useTranslations('docs.adminPayments');

  return (
    <ProtectedRoute>
      <DocsLayout>
        <DocLayout
          title={t('title')}
          description={t('description')}
        >
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('gatewaySetup')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('configuringProviders')}</h3>
                  <p className="mb-3">
                    {t('configDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('configItem1')}</li>
                    <li>{t('configItem2')}</li>
                    <li>{t('configItem3')}
                      <ul className="list-disc list-inside ml-6 mt-2">
                        <li>{t('configFormItem1')}</li>
                        <li>{t('configFormItem2')}</li>
                        <li>{t('configFormItem3')}</li>
                      </ul>
                    </li>
                    <li>{t('configItem4')}</li>
                    <li>{t('configItem5')}</li>
                  </ol>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('supportedProviders')}</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>{t('provider1')}</li>
                    <li>{t('provider2')}</li>
                    <li>{t('provider3')}</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('securityNote')}</h4>
                  <p className="text-sm">
                    {t('securityDesc')}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('subscriptionManagement')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('viewingSubscription')}</h3>
                  <p className="mb-3">
                    {t('viewingDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('viewItem1')}</li>
                    <li>{t('viewItem2')}</li>
                    <li>{t('viewItem3')}</li>
                    <li>{t('viewItem4')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('subscriptionPlans')}</h3>
                  <p className="mb-3">
                    {t('plansDesc')}
                  </p>
                  <div className="space-y-2 ml-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('planFree')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('planStandard')}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
                      <strong>{t('planPremium')}</strong>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('changingPlans')}</h3>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('changeItem1')}</li>
                    <li>{t('changeItem2')}</li>
                    <li>{t('changeItem3')}</li>
                    <li>{t('changeItem4')}</li>
                    <li>{t('changeItem5')}</li>
                    <li>{t('changeItem6')}</li>
                  </ol>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('paymentMethods')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('managingMethods')}</h3>
                  <p className="mb-3">
                    {t('methodsDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('methodItem1')}</li>
                    <li>{t('methodItem2')}</li>
                    <li>{t('methodItem3')}</li>
                    <li>{t('methodItem4')}</li>
                    <li>{t('methodItem5')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('updatingMethods')}</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('updateMethodItem1')}</li>
                    <li>{t('updateMethodItem2')}</li>
                    <li>{t('updateMethodItem3')}</li>
                    <li>{t('updateMethodItem4')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('billingHistory')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('viewingInvoices')}</h3>
                  <p className="mb-3">
                    {t('invoicesDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('invoiceItem1')}</li>
                    <li>{t('invoiceItem2')}</li>
                    <li>{t('invoiceItem3')}</li>
                    <li>{t('invoiceItem4')}</li>
                    <li>{t('invoiceItem5')}</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('invoiceInformation')}</h3>
                  <p className="mb-3">{t('invoiceInfoDesc')}</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('infoItem1')}</li>
                    <li>{t('infoItem2')}</li>
                    <li>{t('infoItem3')}</li>
                    <li>{t('infoItem4')}</li>
                    <li>{t('infoItem5')}</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">{t('processingContributions')}</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">{t('onlinePayments')}</h3>
                  <p className="mb-3">
                    {t('onlineDesc')}
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>{t('onlineItem1')}</li>
                    <li>{t('onlineItem2')}</li>
                    <li>{t('onlineItem3')}</li>
                    <li>{t('onlineItem4')}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">{t('manualPaymentEntry')}</h3>
                  <p className="mb-3">
                    {t('manualPayDesc')}
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li>{t('manualPayItem1')}</li>
                    <li>{t('manualPayItem2')}</li>
                    <li>{t('manualPayItem3')}</li>
                    <li>{t('manualPayItem4')}</li>
                    <li>{t('manualPayItem5')}</li>
                    <li>{t('manualPayItem6')}</li>
                    <li>{t('manualPayItem7')}</li>
                  </ol>
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
