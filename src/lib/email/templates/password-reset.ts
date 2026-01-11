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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    .email-wrapper {
      width: 100%;
      background-color: #f5f5f5;
      padding: 40px 20px;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    
    .email-content {
      padding: 40px;
    }
    
    .header {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    
    .title {
      color: #059669;
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 6px 0;
      line-height: 1.3;
    }
    
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
      line-height: 1.5;
    }
    
    .greeting {
      font-size: 16px;
      color: #111827;
      margin: 0 0 16px 0;
      line-height: 1.6;
    }
    
    .message {
      color: #374151;
      font-size: 15px;
      line-height: 1.6;
      margin: 0 0 24px 0;
    }
    
    .message strong {
      color: #111827;
      font-weight: 600;
    }
    
    .cta {
      text-align: center;
      margin: 32px 0;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #059669;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      line-height: 1.5;
    }
    
    .cta-button:hover {
      background-color: #047857;
    }
    
    .notice {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    
    .notice p {
      color: #92400e;
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .alternative-link {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 15px;
      margin: 24px 0;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .security-note {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .security-note h3 {
      color: #059669;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    
    .security-note p {
      margin: 0;
      font-size: 14px;
      color: #374151;
      line-height: 1.5;
    }
    
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 32px 0;
      border: none;
    }
    
    .footer {
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-text {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 8px 0;
    }
    
    .footer-text strong {
      color: #374151;
      font-weight: 600;
    }
    
    .footer-message {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 24px 0 0 0;
    }
    
    .footer-small {
      color: #9ca3af;
      font-size: 12px;
      line-height: 1.5;
      margin: 16px 0 0 0;
    }
    
    /* Mobile responsive */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      
      .email-content {
        padding: 24px 20px;
      }
      
      .title {
        font-size: 20px;
      }
      
      .cta-button {
        display: block;
        padding: 12px 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-content">
        <div class="header">
          <h1 class="title">Password Reset Request</h1>
          <p class="subtitle">Secure your account</p>
        </div>
        
        <p class="greeting">Assalamu Alaikum ${userName},</p>
        
        <p class="message">
          We received a request to reset the password for your mosque community account. To proceed with updating your password, use the secure link below.
        </p>
        
        <div class="cta">
          <a href="${resetLink}" class="cta-button">Reset My Password</a>
        </div>
        
        <div class="notice">
          <p>This reset link will expire in 1 hour for security reasons</p>
        </div>
        
        <div class="security-note">
          <h3>Security Note</h3>
          <p>This password reset request was initiated from your account settings. Your password remains secure unless you complete the reset process.</p>
        </div>
        
        <p class="message">
          Alternative access: Use this direct link if needed:
        </p>
        
        <div class="alternative-link">
          ${resetLink}
        </div>
        
        <p class="footer-message">
          For technical assistance or security concerns, contact our support team immediately.
        </p>
        
        <hr class="divider">
        
        <div class="footer">
          <p class="footer-text">
            <strong>Stay secure in your faith journey</strong><br>
            Your Mosque Community Support Team
          </p>
          <p class="footer-small">
            This email was sent because a password reset was requested for your account.<br>
            For any security concerns, contact our support team immediately.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}