export interface SignupConfirmationProps {
  userName?: string;
  confirmationURL: string;
  mosqueName?: string;
}

export function generateSignupConfirmationTemplate({
  userName = 'User',
  confirmationURL,
  mosqueName = 'Mosque Community'
}: SignupConfirmationProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Signup</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-top: 40px;
      margin-bottom: 40px;
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      color: #d1fae5;
      margin: 8px 0 0 0;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #475569;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
    }
    .security-note {
      background-color: #f1f5f9;
      border-left: 4px solid #059669;
      padding: 16px 20px;
      margin: 30px 0;
      border-radius: 0 8px 8px 0;
    }
    .security-note p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
    .link-fallback {
      word-break: break-all;
      color: #059669;
      font-size: 14px;
      margin-top: 20px;
      padding: 15px;
      background-color: #f0fdf4;
      border-radius: 6px;
      border: 1px solid #bbf7d0;
    }
    @media (max-width: 600px) {
      .container {
        margin: 20px;
        border-radius: 8px;
      }
      .header, .content, .footer {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .cta-button {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Confirm Your Signup</h1>
      <p>Welcome to khairatkita</p>
    </div>
    
    <div class="content">
      <div class="greeting">
        Hello ${userName}! 👋
      </div>
      
      <div class="message">
          <p>Thank you for joining khairatkita! We're excited to have you as part of our digital ummah.</p>
          
          <p>To complete your registration and start exploring all the features we offer, confirm your email address using the button below:</p>
        </div>
      
      <div style="text-align: center;">
        <a href="${confirmationURL}" class="cta-button">
          Confirm Your Email Address
        </a>
      </div>
      
      <div class="security-note">
        <p><strong>Security Note:</strong> This confirmation link will expire in 24 hours for your security. This account registration was initiated from your device and requires confirmation to activate.</p>
      </div>
      
      <div class="message">
        <p>Once confirmed, you'll be able to:</p>
        <ul style="color: #475569; padding-left: 20px;">
          <li>Browse and register for mosque events</li>
          <li>Make contributions to various programs</li>
          <li>Connect with your local mosque community</li>
          <li>Stay updated with activities</li>
        </ul>
      </div>
      
      <div class="link-fallback">
          <p style="color: #475569; margin: 0 0 10px 0;"><strong>Alternative access:</strong> Use this direct link if needed:</p>
          <p style="color: #059669; margin: 0;">${confirmationURL}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>If you have any questions, feel free to contact our support team.</p>
        <p style="margin-top: 10px;">Barakallahu feeki,<br><strong>${mosqueName} Team</strong></p>
        <p style="margin-top: 15px; font-size: 12px; color: #94a3b8;">You're receiving this email because you recently created an account on khairatkita.com.</p>
      </div>
  </div>
</body>
</html>
  `.trim();
}