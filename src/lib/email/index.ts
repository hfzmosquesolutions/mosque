// Export the main email service
export { EmailService, emailService, resend, DEFAULT_FROM_EMAIL } from './resend';

// Export email templates
export { generateWelcomeEmailTemplate } from './templates/welcome';
export { generatePasswordResetTemplate } from './templates/password-reset';
export { generateSignupConfirmationTemplate } from './templates/signup-confirmation';
export { generateResetPasswordEmail, type ResetPasswordEmailData } from './templates/reset-password';

// Export template types
export type { WelcomeEmailProps } from './templates/welcome';
export type { PasswordResetProps } from './templates/password-reset';
export type { SignupConfirmationProps } from './templates/signup-confirmation';

// Email types for common use cases
export interface BaseEmailProps {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  data?: {
    id: string;
  };
  error?: any;
}

// Utility functions for email validation and formatting
export const emailUtils = {
  /**
   * Validates if an email address is in correct format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validates multiple email addresses
   */
  areValidEmails: (emails: string[]): boolean => {
    return emails.every(email => emailUtils.isValidEmail(email));
  },

  /**
   * Formats a display name with email
   */
  formatEmailWithName: (email: string, name?: string): string => {
    return name ? `${name} <${email}>` : email;
  },

  /**
   * Sanitizes email content to prevent injection
   */
  sanitizeEmailContent: (content: string): string => {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
};

// Email template helpers
export const templateHelpers = {
  /**
   * Formats date for email templates
   */
  formatDate: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Truncates text for email previews
   */
  truncateText: (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  /**
   * Generates a greeting based on time of day
   */
  getTimeBasedGreeting: (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  },
};