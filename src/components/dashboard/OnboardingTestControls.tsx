'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { resetOnboardingStatus } from '@/lib/api';

export function OnboardingTestControls() {
  const { user } = useAuth();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const resetOnboarding = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setIsResetting(true);
    try {
      const result = await resetOnboardingStatus(user.id);
      
      if (result.success) {
        toast.success('Onboarding status reset successfully!');
        setIsDialogOpen(false);
        // Redirect to onboarding
        router.push('/onboarding');
      } else {
        toast.error(result.error || 'Failed to reset onboarding status');
      }
    } catch (error) {
      console.error('Reset onboarding error:', error);
      toast.error('Failed to reset onboarding status');
    } finally {
      setIsResetting(false);
    }
  };

  // Only show in development or for testing
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
          <AlertTriangle className="h-5 w-5" />
          Development Tools
        </CardTitle>
        <CardDescription className="text-orange-700 dark:text-orange-300">
          Testing utilities for the onboarding system (development only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Onboarding Data</DialogTitle>
              <DialogDescription>
                This will clear your onboarding completion status and profile
                data, allowing you to go through the onboarding process again.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isResetting}>
                Cancel
              </Button>
              <Button onClick={resetOnboarding} disabled={isResetting} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
                {isResetting ? 'Resetting...' : 'Reset Onboarding'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-4 text-xs text-orange-600 dark:text-orange-400">
          <p>
            This will reset your onboarding completion status in the database,
            allowing you to go through the onboarding process again.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
