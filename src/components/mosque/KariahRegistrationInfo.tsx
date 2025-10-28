'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';
import { getKariahRegistrationSettings } from '@/lib/api';

interface KariahRegistrationInfoProps {
  mosqueId: string;
}

interface KariahRegistrationSettings {
  requirements: string;
  benefits: string;
  custom_message: string;
}

export function KariahRegistrationInfo({ mosqueId }: KariahRegistrationInfoProps) {
  const t = useTranslations('mosqueProfile');
  const [settings, setSettings] = useState<KariahRegistrationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [mosqueId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await getKariahRegistrationSettings(mosqueId);
      
      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading kariah registration settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!settings || (!settings.requirements && !settings.benefits && !settings.custom_message)) {
    return null;
  }

  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
      <div className="space-y-3 text-sm">
        {/* Custom Welcome Message */}
        {settings.custom_message && (
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            {settings.custom_message}
          </p>
        )}
        
        {/* Requirements */}
        {settings.requirements && (
          <div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide mb-1">
              {t('requirements')}
            </h4>
            <div className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {settings.requirements}
            </div>
          </div>
        )}
        
        {/* Benefits */}
        {settings.benefits && (
          <div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide mb-1">
              {t('benefits')}
            </h4>
            <div className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {settings.benefits}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
