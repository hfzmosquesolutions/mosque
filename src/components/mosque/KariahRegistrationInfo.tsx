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
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-purple-600" />
        <h3 className="font-medium text-slate-900 dark:text-slate-100">
          Become an Ahli Kariah
        </h3>
      </div>
      
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
        {/* Custom Welcome Message */}
        {settings.custom_message && (
          <p>{settings.custom_message}</p>
        )}
        
        {/* Requirements */}
        {settings.requirements && (
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-300">Requirements:</span>
            <p className="mt-1">{settings.requirements}</p>
          </div>
        )}
        
        {/* Benefits */}
        {settings.benefits && (
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-300">Benefits:</span>
            <p className="mt-1">{settings.benefits}</p>
          </div>
        )}
      </div>
    </div>
  );
}
