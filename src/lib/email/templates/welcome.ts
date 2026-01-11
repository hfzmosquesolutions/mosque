export interface WelcomeEmailProps {
  userName: string;
  mosqueName?: string;
}

export function generateWelcomeEmailTemplate({
  userName,
  mosqueName = 'Our Mosque Community',
}: WelcomeEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to ${mosqueName}</title>
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
    
    .features {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .features h3 {
      color: #059669;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .feature-list li {
      padding: 8px 0;
      color: #374151;
      font-size: 14px;
      line-height: 1.5;
      position: relative;
      padding-left: 24px;
    }
    
    .feature-list li:before {
      content: '•';
      position: absolute;
      left: 0;
      color: #059669;
      font-weight: bold;
      font-size: 18px;
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
          <h1 class="title">Welcome to ${mosqueName}</h1>
          <p class="subtitle">Assalamu Alaikum and welcome to our community</p>
        </div>
        
        <p class="greeting">Dear ${userName},</p>
        
        <p class="message">
          We are delighted to welcome you to our mosque community platform! Your journey with us begins now, and we're excited to have you as part of our growing family.
        </p>
        
        <p class="message">
          This platform has been designed to help you stay connected with your mosque community, participate in events, make contributions, and strengthen your spiritual journey alongside fellow believers.
        </p>
        
        <div class="features">
          <h3>What you can do with your account:</h3>
          <ul class="feature-list">
            <li>Stay updated with mosque programs and activities</li>
            <li>Make secure donations and contributions</li>
            <li>Connect with other community members</li>
            <li>Access Islamic resources and educational materials</li>
            <li>Manage your family and dependents</li>
            <li>Receive important notifications</li>
          </ul>
        </div>
        
        <p class="message">
          We encourage you to explore the platform and customize your profile to get the most out of your experience. If you have any questions or need assistance, please don't hesitate to reach out to our community administrators.
        </p>
        
        <div class="cta">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta-button">Explore Your Dashboard</a>
        </div>
        
        <p class="footer-message">
          We encourage you to explore the platform and customize your profile to get the most out of your experience.
        </p>
        
        <hr class="divider">
        
        <div class="footer">
          <p class="footer-text">
            <strong>May Allah bless your journey with us</strong><br>
            The ${mosqueName} Team
          </p>
          <p class="footer-small">
            This email was sent to you because you recently created an account with ${mosqueName}.<br>
            For any account security concerns, contact our support team.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}