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
  <title>Welcome to ${mosqueName}</title>
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
      background: linear-gradient(135deg, #10b981, #059669);
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
      color: #10b981;
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
    .features {
      background-color: #f0fdf4;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .features h3 {
      color: #10b981;
      margin: 0 0 15px 0;
      font-size: 18px;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .feature-list li {
      padding: 8px 0;
      color: #374151;
      position: relative;
      padding-left: 25px;
    }
    .feature-list li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981, #059669);
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🕌</div>
      <h1 class="title">Welcome to ${mosqueName}</h1>
      <p class="subtitle">Assalamu Alaikum and welcome to our community</p>
    </div>
    
    <div class="content">
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
          <li>Stay updated with mosque events and announcements</li>
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
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="cta-button">
          Explore Your Dashboard
        </a>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer">
      <p>
        <strong>May Allah bless your journey with us</strong><br>
        The ${mosqueName} Team
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        This email was sent to you because you recently created an account with ${mosqueName}.
        For any account security concerns, contact our support team.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}