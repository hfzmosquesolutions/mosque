import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender email - should be configured in environment
export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourmosque.com';

// Email service class for handling different types of emails
export class EmailService {
  private static instance: EmailService;
  private resendClient: Resend;

  private constructor() {
    this.resendClient = resend;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail({
    to,
    subject,
    html,
    from = DEFAULT_FROM_EMAIL,
  }: {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }) {
    try {
      const result = await this.resendClient.emails.send({
        from,
        to,
        subject,
        html,
      });
      
      console.log('Email sent successfully:', result.data?.id);
      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail({
    to,
    userName,
    mosqueName,
  }: {
    to: string;
    userName: string;
    mosqueName?: string;
  }) {
    const { generateWelcomeEmailTemplate } = await import('./templates/welcome');
    
    const html = generateWelcomeEmailTemplate({
      userName,
      mosqueName,
    });

    return this.sendEmail({
      to,
      subject: `Welcome to ${mosqueName || 'Our Mosque Community'}!`,
      html,
    });
  }

  async sendEventNotificationEmail({
    to,
    userName,
    eventTitle,
    eventDate,
    eventLocation,
    mosqueName,
  }: {
    to: string;
    userName: string;
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    mosqueName: string;
  }) {
    const { generateEventNotificationTemplate } = await import('./templates/event-notification');
    
    const html = generateEventNotificationTemplate({
      userName,
      eventTitle,
      eventDate,
      eventLocation,
      mosqueName,
    });

    return this.sendEmail({
      to,
      subject: `New Event: ${eventTitle}`,
      html,
    });
  }

  async sendPasswordResetEmail({
    to,
    userName,
    resetLink,
  }: {
    to: string;
    userName: string;
    resetLink: string;
  }) {
    const { generatePasswordResetTemplate } = await import('./templates/password-reset');
    
    const html = generatePasswordResetTemplate({
      userName,
      resetLink,
    });

    return this.sendEmail({
      to,
      subject: 'Reset Your Password',
      html,
    });
  }
}

export const emailService = EmailService.getInstance();