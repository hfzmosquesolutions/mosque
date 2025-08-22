'use client';

import { useEffect, useState } from 'react';
import { useWelcomeEmail } from '@/hooks/useWelcomeEmail';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WelcomeEmailTriggerProps {
  userId: string;
  userEmail: string;
  userName: string;
  mosqueName?: string;
  autoSend?: boolean;
  showStatus?: boolean;
}

export function WelcomeEmailTrigger({
  userId,
  userEmail,
  userName,
  mosqueName,
  autoSend = false,
  showStatus = true,
}: WelcomeEmailTriggerProps) {
  const {
    sendWelcomeEmailIfNeeded,
    checkWelcomeEmailStatus,
    isLoading,
    isChecking,
  } = useWelcomeEmail();

  const [emailStatus, setEmailStatus] = useState<{
    sent: boolean;
    lastSent: string | null;
    emailId: string | null;
  } | null>(null);

  const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

  // Check email status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!hasCheckedStatus) {
        const status = await checkWelcomeEmailStatus(userId);
        if (status) {
          setEmailStatus({
            sent: status.welcomeEmailSent,
            lastSent: status.lastSent,
            emailId: status.emailId,
          });
        }
        setHasCheckedStatus(true);
      }
    };

    checkStatus();
  }, [userId, checkWelcomeEmailStatus, hasCheckedStatus]);

  // Auto-send welcome email if enabled and not already sent
  useEffect(() => {
    const autoSendEmail = async () => {
      if (autoSend && hasCheckedStatus && emailStatus && !emailStatus.sent) {
        try {
          const result = await sendWelcomeEmailIfNeeded({
            userId,
            userEmail,
            userName,
            mosqueName,
          });

          if (result.success) {
            setEmailStatus({
              sent: true,
              lastSent: new Date().toISOString(),
              emailId: result.emailId || null,
            });

            if (!('alreadySent' in result) || !result.alreadySent) {
              toast.success('Welcome email sent automatically!');
            }
          }
        } catch (error) {
          console.error('Auto-send welcome email failed:', error);
        }
      }
    };

    autoSendEmail();
  }, [
    autoSend,
    hasCheckedStatus,
    emailStatus,
    sendWelcomeEmailIfNeeded,
    userId,
    userEmail,
    userName,
    mosqueName,
  ]);

  const handleSendEmail = async () => {
    try {
      const result = await sendWelcomeEmailIfNeeded({
        userId,
        userEmail,
        userName,
        mosqueName,
      });

      if (result.success) {
        setEmailStatus({
          sent: true,
          lastSent:
            'alreadySent' in result && result.alreadySent
              ? result.lastSent || new Date().toISOString()
              : new Date().toISOString(),
          emailId: result.emailId || null,
        });

        if ('alreadySent' in result && result.alreadySent) {
          toast.info('Welcome email was already sent to this user.');
        } else {
          toast.success('Welcome email sent successfully!');
        }
      }
    } catch (error) {
      toast.error('Failed to send welcome email. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!showStatus && autoSend) {
    // Silent auto-send mode - no UI
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Welcome Email</CardTitle>
        </div>
        <CardDescription>
          Send a welcome email to {userName} ({userEmail})
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Email Status */}
        {isChecking ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-spin" />
            Checking email status...
          </div>
        ) : emailStatus ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {emailStatus.sent ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    Email Sent
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <Badge
                    variant="outline"
                    className="border-amber-200 text-amber-800"
                  >
                    Not Sent
                  </Badge>
                </>
              )}
            </div>

            {emailStatus.sent && emailStatus.lastSent && (
              <p className="text-sm text-muted-foreground">
                Sent on {formatDate(emailStatus.lastSent)}
              </p>
            )}

            {emailStatus.emailId && (
              <p className="text-xs text-muted-foreground font-mono">
                ID: {emailStatus.emailId}
              </p>
            )}
          </div>
        ) : null}

        {/* Mosque Name */}
        {mosqueName && (
          <div className="text-sm">
            <span className="text-muted-foreground">Mosque: </span>
            <span className="font-medium">{mosqueName}</span>
          </div>
        )}

        {/* Send Button */}
        <Button
          onClick={handleSendEmail}
          disabled={isLoading || isChecking}
          className="w-full"
          variant={emailStatus?.sent ? 'outline' : 'default'}
        >
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : emailStatus?.sent ? (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Resend Welcome Email
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Welcome Email
            </>
          )}
        </Button>

        {/* Help Text */}
        <p className="text-xs text-muted-foreground text-center">
          {emailStatus?.sent
            ? 'The welcome email can be sent again if needed.'
            : 'This will send a welcome email with platform information and next steps.'}
        </p>
      </CardContent>
    </Card>
  );
}

// Simplified version for inline use
export function WelcomeEmailButton({
  userId,
  userEmail,
  userName,
  mosqueName,
  variant = 'outline',
  size = 'sm',
}: WelcomeEmailTriggerProps & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}) {
  const { sendWelcomeEmailIfNeeded, isLoading } = useWelcomeEmail();

  const handleSend = async () => {
    await sendWelcomeEmailIfNeeded({
      userId,
      userEmail,
      userName,
      mosqueName,
    });
  };

  return (
    <Button
      onClick={handleSend}
      disabled={isLoading}
      variant={variant}
      size={size}
    >
      {isLoading ? (
        <Clock className="h-3 w-3 mr-1 animate-spin" />
      ) : (
        <Mail className="h-3 w-3 mr-1" />
      )}
      {isLoading ? 'Sending...' : 'Welcome Email'}
    </Button>
  );
}
