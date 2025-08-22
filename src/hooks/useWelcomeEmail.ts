import { useState } from 'react';
import { toast } from 'sonner';

interface SendWelcomeEmailParams {
  userId: string;
  userEmail: string;
  userName: string;
  mosqueName?: string;
}

interface WelcomeEmailStatus {
  welcomeEmailSent: boolean;
  lastSent: string | null;
  emailId: string | null;
}

export function useWelcomeEmail() {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const sendWelcomeEmail = async (params: SendWelcomeEmailParams) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send welcome email');
      }

      toast.success('Welcome email sent successfully!');
      return {
        success: true,
        emailId: data.emailId,
        message: data.message,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send welcome email';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const checkWelcomeEmailStatus = async (userId: string): Promise<WelcomeEmailStatus | null> => {
    setIsChecking(true);
    
    try {
      const response = await fetch(`/api/email/welcome?userId=${encodeURIComponent(userId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check welcome email status');
      }

      return {
        welcomeEmailSent: data.welcomeEmailSent,
        lastSent: data.lastSent,
        emailId: data.emailId,
      };

    } catch (error) {
      console.error('Error checking welcome email status:', error);
      toast.error('Failed to check welcome email status');
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  const sendWelcomeEmailIfNeeded = async (params: SendWelcomeEmailParams) => {
    // First check if welcome email was already sent
    const status = await checkWelcomeEmailStatus(params.userId);
    
    if (status?.welcomeEmailSent) {
      console.log('Welcome email already sent to user:', params.userId);
      return {
        success: true,
        alreadySent: true,
        lastSent: status.lastSent,
        emailId: status.emailId,
      };
    }

    // Send welcome email if not already sent
    return await sendWelcomeEmail(params);
  };

  return {
    sendWelcomeEmail,
    checkWelcomeEmailStatus,
    sendWelcomeEmailIfNeeded,
    isLoading,
    isChecking,
  };
}

// Utility function to be used in server components or API routes
export async function triggerWelcomeEmail(params: SendWelcomeEmailParams) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send welcome email');
    }

    return {
      success: true,
      emailId: data.emailId,
      message: data.message,
    };

  } catch (error) {
    console.error('Error triggering welcome email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send welcome email',
    };
  }
}