'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap } from 'lucide-react';
import { isFeatureAvailable } from '@/lib/subscription';
import { SubscriptionPlan } from '@/lib/stripe';

interface FeatureGateProps {
  mosqueId: string;
  featureName: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPlan?: SubscriptionPlan;
  showUpgrade?: boolean;
  onUpgrade?: () => void;
}

export function FeatureGate({
  mosqueId,
  featureName,
  children,
  fallback,
  requiredPlan = 'standard',
  showUpgrade = true,
  onUpgrade
}: FeatureGateProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFeature = async () => {
      try {
        const available = await isFeatureAvailable(mosqueId, featureName);
        setIsAvailable(available);
      } catch (error) {
        console.error('Error checking feature availability:', error);
        setIsAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    if (mosqueId) {
      checkFeature();
    }
  }, [mosqueId, featureName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isAvailable) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const getPlanIcon = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'standard':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'pro':
        return <Zap className="h-5 w-5 text-purple-500" />;
      default:
        return <Lock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPlanName = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'standard':
        return 'Standard';
      case 'pro':
        return 'Pro';
      default:
        return 'Free';
    }
  };

  return (
    <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-full w-fit">
          {getPlanIcon(requiredPlan)}
        </div>
        <CardTitle className="text-lg">
          {getPlanName(requiredPlan)} Feature
        </CardTitle>
        <CardDescription>
          This feature is available with a {getPlanName(requiredPlan)} subscription.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="space-y-2">
          <Badge variant="outline" className="text-sm">
            {getPlanName(requiredPlan)} Required
          </Badge>
        </div>
        {showUpgrade && onUpgrade && (
          <Button onClick={onUpgrade} className="w-full">
            Upgrade to {getPlanName(requiredPlan)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

