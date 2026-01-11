export interface ResetPasswordEmailData {
  confirmationUrl: string;
  mosqueName?: string;
}

export function generateResetPasswordEmail({
  confirmationUrl,
  mosqueName = 'khairatkita'
}: ResetPasswordEmailData): string {
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
    
    .message ul {
      color: #374151;
      padding-left: 20px;
      margin: 16px 0;
    }
    
    .message li {
      margin: 8px 0;
      line-height: 1.5;
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
    
    .security-note strong {
      color: #059669;
      font-weight: 600;
    }
    
    .link-fallback {
      word-break: break-all;
      color: #059669;
      font-size: 14px;
      margin: 24px 0;
      padding: 15px;
      background-color: #f0fdf4;
      border-radius: 6px;
      border: 1px solid #86efac;
    }
    
    .link-fallback p {
      margin: 0 0 8px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .link-fallback p:last-child {
      margin: 0;
      color: #059669;
      font-family: monospace;
      font-size: 12px;
    }
    
    .link-fallback strong {
      color: #111827;
      font-weight: 600;
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
          <h1 class="title">Reset Your Password</h1>
          <p class="subtitle">${mosqueName}</p>
        </div>
        
        <p class="greeting">Assalamu Alaikum,</p>
        
        <p class="message">
          We received a request to reset your password for your khairatkita account. To proceed with updating your password, use the secure link below:
        </p>
        
        <div class="cta">
          <a href="${confirmationUrl}" class="cta-button">Reset Your Password</a>
        </div>
        
        <div class="notice">
          <p>This password reset link will expire in 1 hour for security reasons</p>
        </div>
        
        <div class="security-note">
          <h3>Security Note</h3>
          <p>This password reset request was initiated from your account settings. Your password remains secure unless you complete the reset process.</p>
        </div>
        
        <p class="message">
          Alternative access: Use this direct link if needed:
        </p>
        
        <div class="link-fallback">
          <p><strong>Alternative access:</strong> Use this direct link if needed:</p>
          <p>${confirmationUrl}</p>
        </div>
        
        <p class="footer-message">
          For technical assistance or security concerns, contact our support team immediately.
        </p>
        
        <hr class="divider">
        
        <div class="footer">
          <p class="footer-text">
            <strong>Barakallahu feeki</strong><br>
            ${mosqueName} Team
          </p>
          <p class="footer-small">
            You're receiving this email because a password reset was requested for your account on khairatkita.com.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}