export interface KhairatRegistrationNotificationProps {
  adminName: string;
  mosqueName: string;
  applicantName: string;
  applicantIC: string;
  applicantPhone?: string;
  applicantEmail?: string;
  applicantAddress?: string;
  applicationReason?: string;
  reviewUrl: string;
}

export function generateKhairatRegistrationTemplate({
  adminName,
  mosqueName,
  applicantName,
  applicantIC,
  applicantPhone,
  applicantEmail,
  applicantAddress,
  applicationReason,
  reviewUrl,
}: KhairatRegistrationNotificationProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Khairat Registration - ${mosqueName}</title>
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
    .application-details {
      background-color: #f0fdf4;
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .application-details h3 {
      color: #10b981;
      margin: 0 0 15px 0;
      font-size: 18px;
      display: flex;
      align-items: center;
    }
    .detail-row {
      display: flex;
      padding: 8px 0;
      border-bottom: 1px solid #d1fae5;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #374151;
      min-width: 120px;
      flex-shrink: 0;
    }
    .detail-value {
      color: #4b5563;
      flex: 1;
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
    .notice {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .notice p {
      color: #92400e;
      margin: 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📋</div>
      <h1 class="title">New Khairat Registration</h1>
      <p class="subtitle">${mosqueName}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Assalamu Alaikum ${adminName},</p>
      
      <p class="message">
        A new khairat registration has been submitted for <strong>${mosqueName}</strong>. Please review the application details below and take appropriate action.
      </p>
      
      <div class="application-details">
        <h3>📝 Application Details</h3>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${applicantName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">IC/Passport:</span>
          <span class="detail-value">${applicantIC}</span>
        </div>
        ${applicantPhone ? `
        <div class="detail-row">
          <span class="detail-label">Phone:</span>
          <span class="detail-value">${applicantPhone}</span>
        </div>
        ` : ''}
        ${applicantEmail ? `
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${applicantEmail}</span>
        </div>
        ` : ''}
        ${applicantAddress ? `
        <div class="detail-row">
          <span class="detail-label">Address:</span>
          <span class="detail-value">${applicantAddress}</span>
        </div>
        ` : ''}
        ${applicationReason ? `
        <div class="detail-row">
          <span class="detail-label">Reason:</span>
          <span class="detail-value">${applicationReason}</span>
        </div>
        ` : ''}
      </div>
      
      <div class="notice">
        <p>⏰ This application is pending your review. Please review and approve or reject it as soon as possible.</p>
      </div>
      
      <div class="cta">
        <a href="${reviewUrl}" class="cta-button">
          Review Application
        </a>
      </div>
      
      <p class="message">
        You can also access this application from your mosque dashboard under the Khairat Management section.
      </p>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer">
      <p>
        <strong>May Allah guide your decisions</strong><br>
        ${mosqueName} Administration Team
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        This is an automated notification from the khairatkita platform.
        For any questions or concerns, please contact our support team.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}




