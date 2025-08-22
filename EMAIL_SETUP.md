# Email Setup Guide

This guide will help you set up email functionality using Resend for your mosque community platform.

## Overview

The email system provides:

- Welcome emails for new users
- Event notification emails
- Password reset emails
- Reusable email templates
- Email tracking and logging

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Domain Verification**: Verify your domain with Resend (optional but recommended for production)
3. **Environment Variables**: Configure the required environment variables

## Setup Instructions

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address
3. Complete the onboarding process

### Step 2: Get API Key

1. In your Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Mosque Platform")
4. Select the appropriate permissions:
   - `emails:send` (required)
   - `emails:read` (optional, for tracking)
5. Copy the generated API key

### Step 3: Domain Setup (Recommended for Production)

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourmosque.com`)
4. Follow the DNS configuration instructions
5. Wait for domain verification (usually takes a few minutes)

### Step 4: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Important Notes:**

- Replace `re_your_api_key_here` with your actual Resend API key
- Replace `noreply@yourdomain.com` with your verified email address
- For development, you can use `noreply@resend.dev` (Resend's test domain)
- Set `NEXT_PUBLIC_APP_URL` to your production domain for production builds

## Usage

### Sending Welcome Emails

#### Using the Hook (Client-side)

```typescript
import { useWelcomeEmail } from '@/hooks/useWelcomeEmail';

function MyComponent() {
  const { sendWelcomeEmail, isLoading } = useWelcomeEmail();

  const handleSendWelcome = async () => {
    await sendWelcomeEmail({
      userId: 'user-uuid',
      userEmail: 'user@example.com',
      userName: 'John Doe',
      mosqueName: 'Al-Noor Mosque', // optional
    });
  };

  return (
    <button onClick={handleSendWelcome} disabled={isLoading}>
      {isLoading ? 'Sending...' : 'Send Welcome Email'}
    </button>
  );
}
```

#### Using the API Route (Server-side)

```typescript
// In your API route or server component
import { triggerWelcomeEmail } from '@/hooks/useWelcomeEmail';

const result = await triggerWelcomeEmail({
  userId: 'user-uuid',
  userEmail: 'user@example.com',
  userName: 'John Doe',
  mosqueName: 'Al-Noor Mosque',
});

if (result.success) {
  console.log('Welcome email sent:', result.emailId);
} else {
  console.error('Failed to send email:', result.error);
}
```

### Using Email Service Directly

```typescript
import { emailService } from '@/lib/email';

// Send welcome email
await emailService.sendWelcomeEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  mosqueName: 'Al-Noor Mosque',
});

// Send event notification
await emailService.sendEventNotificationEmail({
  to: 'user@example.com',
  userName: 'John Doe',
  eventTitle: 'Friday Prayer',
  eventDate: 'Friday, January 15, 2024 at 1:00 PM',
  eventLocation: 'Main Prayer Hall',
  mosqueName: 'Al-Noor Mosque',
});

// Send custom email
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Custom HTML Content</h1>',
});
```

## Email Templates

The system includes pre-built templates:

### 1. Welcome Email Template

- **File**: `src/lib/email/templates/welcome.ts`
- **Purpose**: Welcome new users to the platform
- **Features**: Mosque branding, feature highlights, call-to-action

### 2. Event Notification Template

- **File**: `src/lib/email/templates/event-notification.ts`
- **Purpose**: Notify users about new events
- **Features**: Event details, date/time formatting, location info

### 3. Password Reset Template

- **File**: `src/lib/email/templates/password-reset.ts`
- **Purpose**: Help users reset their passwords
- **Features**: Security notices, expiration warnings, alternative links

### Creating Custom Templates

```typescript
// src/lib/email/templates/custom-template.ts
export interface CustomEmailProps {
  userName: string;
  customData: string;
}

export function generateCustomEmailTemplate({
  userName,
  customData,
}: CustomEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Custom Email</title>
  <style>
    /* Your custom styles */
  </style>
</head>
<body>
  <h1>Hello ${userName}!</h1>
  <p>${customData}</p>
</body>
</html>
  `.trim();
}
```

## API Endpoints

### POST /api/email/welcome

Sends a welcome email to a new user.

**Request Body:**

```json
{
  "userId": "user-uuid",
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "mosqueName": "Al-Noor Mosque"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Welcome email sent successfully",
  "emailId": "email-id-from-resend"
}
```

### GET /api/email/welcome?userId=user-uuid

Checks if a welcome email was already sent to a user.

**Response:**

```json
{
  "welcomeEmailSent": true,
  "lastSent": "2024-01-15T10:30:00Z",
  "emailId": "email-id-from-resend"
}
```

## Email Tracking

Emails are automatically logged in the `notifications` table with:

- User ID
- Email type
- Resend email ID
- Timestamp
- Metadata (mosque name, etc.)

## Testing

### Development Testing

1. Use Resend's test domain: `noreply@resend.dev`
2. Check Resend dashboard for email delivery status
3. Use tools like [MailHog](https://github.com/mailhog/MailHog) for local testing

### Production Testing

1. Verify domain is properly configured
2. Test with real email addresses
3. Monitor delivery rates in Resend dashboard
4. Set up webhooks for delivery tracking (optional)

## Troubleshooting

### Common Issues

1. **"RESEND_API_KEY is not set" Error**

   - Ensure the API key is properly set in your environment variables
   - Restart your development server after adding the key

2. **Emails Not Sending**

   - Check your Resend dashboard for error logs
   - Verify the from email address is authorized
   - Ensure your domain is verified (for production)

3. **Invalid Email Format**

   - The system validates email formats automatically
   - Check that email addresses are properly formatted

4. **Rate Limiting**
   - Resend has rate limits based on your plan
   - Implement retry logic for high-volume sending

### Debug Mode

Enable debug logging by setting:

```env
NODE_ENV=development
```

This will log email sending attempts to the console.

## Security Best Practices

1. **API Key Security**

   - Never commit API keys to version control
   - Use environment variables for all sensitive data
   - Rotate API keys regularly

2. **Email Validation**

   - Always validate email addresses before sending
   - Implement rate limiting to prevent abuse
   - Use CSRF protection on email endpoints

3. **Content Security**
   - Sanitize user input in email templates
   - Use parameterized templates to prevent injection
   - Validate all template data

## Monitoring and Analytics

1. **Resend Dashboard**

   - Monitor delivery rates
   - Track bounces and complaints
   - View email analytics

2. **Application Logging**
   - Email attempts are logged in the notifications table
   - Monitor failed sends and retry logic
   - Track user engagement with emails

## Scaling Considerations

1. **Volume Planning**

   - Choose appropriate Resend plan for your volume
   - Implement queue system for high-volume sending
   - Consider batch sending for newsletters

2. **Performance**
   - Use async email sending to avoid blocking requests
   - Implement retry logic with exponential backoff
   - Cache email templates for better performance

## Support

For issues related to:

- **Resend Service**: Contact [Resend Support](https://resend.com/support)
- **Platform Integration**: Check the application logs and this documentation
- **Template Customization**: Refer to the template files in `src/lib/email/templates/`

---

**Next Steps:**

1. Set up your Resend account and get your API key
2. Configure environment variables
3. Test email sending in development
4. Customize email templates for your mosque
5. Deploy and test in production
