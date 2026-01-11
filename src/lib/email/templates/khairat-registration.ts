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
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Khairat Registration - ${mosqueName}</title>
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
    
    .application-details {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 6px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .application-details h3 {
      color: #059669;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    
    .detail-row {
      padding: 10px 0;
      border-bottom: 1px solid #d1fae5;
    }
    
    .detail-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .detail-label {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
      display: inline-block;
      min-width: 80px;
      margin-right: 12px;
    }
    
    .detail-value {
      color: #111827;
      font-size: 14px;
      line-height: 1.5;
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
    
    .footer-message {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 24px 0 0 0;
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
      
      .detail-label {
        display: block;
        margin-bottom: 4px;
        min-width: auto;
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
          <h1 class="title">New Khairat Registration</h1>
          <p class="subtitle">${mosqueName}</p>
        </div>
        
        <p class="greeting">Assalamu Alaikum ${adminName},</p>
        
        <p class="message">
          A new khairat registration has been submitted for <strong>${mosqueName}</strong>. Please review the application details below and take appropriate action.
        </p>
        
        <div class="application-details">
          <h3>Application Details</h3>
          <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${applicantName}</span>
          </div>
          ${applicationReason ? `
          <div class="detail-row">
            <span class="detail-label">Reason:</span>
            <span class="detail-value">${applicationReason}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="notice">
          <p>This application is pending your review. Please review and approve or reject it as soon as possible.</p>
        </div>
        
        <div class="cta">
          <a href="${reviewUrl}" class="cta-button">View Members</a>
        </div>
        
        <p class="footer-message">
          You can check the status of all khairat members and applications from the Members page in your dashboard.
        </p>
        
        <hr class="divider">
        
        <div class="footer">
          <p class="footer-text">
            <strong>May Allah guide your decisions</strong><br>
            ${mosqueName} Administration Team
          </p>
          <p class="footer-small">
            This is an automated notification from the khairatkita platform.<br>
            For any questions or concerns, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}





