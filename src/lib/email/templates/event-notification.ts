export interface EventNotificationProps {
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  mosqueName: string;
}

export function generateEventNotificationTemplate({
  userName,
  eventTitle,
  eventDate,
  eventLocation,
  mosqueName,
}: EventNotificationProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Event: ${eventTitle}</title>
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
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
      color: #3b82f6;
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
    .event-card {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
      border-left: 4px solid #3b82f6;
    }
    .event-title {
      color: #1e40af;
      font-size: 22px;
      font-weight: bold;
      margin: 0 0 15px 0;
    }
    .event-details {
      display: grid;
      gap: 10px;
    }
    .event-detail {
      display: flex;
      align-items: center;
      color: #374151;
      font-size: 16px;
    }
    .event-detail-icon {
      width: 20px;
      margin-right: 10px;
      text-align: center;
    }
    .cta {
      text-align: center;
      margin: 30px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
      <div class="logo">📅</div>
      <h1 class="title">New Event Announcement</h1>
      <p class="subtitle">From ${mosqueName}</p>
    </div>
    
    <div class="content">
      <p class="greeting">Assalamu Alaikum ${userName},</p>
      
      <p class="message">
        We're excited to announce a new event at our mosque! We hope you can join us for this meaningful gathering.
      </p>
      
      <div class="event-card">
        <h2 class="event-title">${eventTitle}</h2>
        <div class="event-details">
          <div class="event-detail">
            <span class="event-detail-icon">📅</span>
            <strong>Date & Time:</strong>&nbsp;${eventDate}
          </div>
          <div class="event-detail">
            <span class="event-detail-icon">📍</span>
            <strong>Location:</strong>&nbsp;${eventLocation}
          </div>
          <div class="event-detail">
            <span class="event-detail-icon">🕌</span>
            <strong>Organized by:</strong>&nbsp;${mosqueName}
          </div>
        </div>
      </div>
      
      <p class="message">
        This event is a wonderful opportunity to strengthen our community bonds and grow together in faith. We encourage all community members to participate and invite their families and friends.
      </p>
      
      <p class="message">
        For more details about this event, including any requirements or preparations needed, please visit your dashboard or contact our event coordinators.
      </p>
      
      <div class="cta">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/events" class="cta-button">
          View Event Details
        </a>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <div class="footer">
      <p>
        <strong>Barakallahu feekum</strong><br>
        The ${mosqueName} Events Team
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
        You received this email because you have event notifications enabled in your account settings.
        You can manage your notification preferences in your dashboard.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}