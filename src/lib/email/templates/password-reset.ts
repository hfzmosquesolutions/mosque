export interface PasswordResetProps {
  userName: string;
  resetLink: string;
}

export function generatePasswordResetTemplate({
  userName,
  resetLink,
}: PasswordResetProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background-color: #ffffff;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      font-weight: bold;
    }
    .title {
      color: #f59e0b;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .subtitle {
      color: #6b7280;
      font-size: 16px;
      margin: 10px 0 0 0;
    }
    .content {
      margin: 30px 0;
    }
    .greeting {
      font-size: 18px;
      color: #374151;
      margin-bottom: 20px;
    }
    .message {
      color: #4b5563;
      margin-bottom: 20px;
      line-height: 1.7;
    }
    .security-notice {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .security-notice h3 {
      color: #92400e;
      margin: 0 0 10px 0;
      font-size: 16px;
      display: flex;
      align-items: center;
    }
    .security-notice p {
      color: #92400e;
      margin: 0;
      font-size: 14px;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .alternative-link {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
      color: #6b7280;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e5e7eb, transparent);
      margin: 30px 0;
    }
    .expiry-notice {
      background-color: #fef2f2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .expiry-notice p {
      color: #dc2626;
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🔐</div>
      <h1 class="title">Password Reset Request</h1>
      <p class="subtitle">Secure your account</p>
    </div>
    
    <div class="content">
      <p class="greeting">Assalamu Alaikum ${userName},</p>
      
      <p class="message">
        We received a request to reset the password for your mosque community account. To proceed with updating your password, use the secure link below.
      </p>
      
      <div class="cta">
        <a href="${resetLink}" class="cta-button">
          Reset My Password
        </a>
      </div>
      
      <div class="expiry-notice">
        <p>⏰ This reset link will expire in 1 hour for security reasons</p>
      </div>
      
      <p class="message">
        Alternative access: Use this direct link if needed:
      </p>
      
      <div class="alternative-link">
        ${resetLink}
      </div>
      
      <div class="security-notice">
        <h3>🛡️ Security Notice</h3>
        <p>
          This password reset request was initiated from your account settings. Your password remains secure unless you complete the reset process. 
          For additional security, consider enabling two-factor authentication in your account settings.
        </p>
      </div>
      
      <p class="message">
        For technical assistance or security concerns, contact our support team immediately.
      </p>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer">
      <p>
        <strong>Stay secure in your faith journey</strong><br>
        Your Mosque Community Support Team
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        This email was sent because a password reset was requested for your account.
        For any security concerns, contact our support team immediately.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}