/**
 * Server-side email notification helper for Esports Calendar event bookings
 */

interface SendEmailParams {
  to: string;
  subject: string;
  eventName: string;
  status: "approved" | "rejected";
  reason?: string;
}

export async function sendBookingStatusEmail({
  to,
  subject,
  eventName,
  status,
  reason,
}: SendEmailParams): Promise<boolean> {
  try {
    const isApproved = status === "approved";
    
    console.log(`
=================================================================
[AFRICA BR CALENDAR EMAIL NOTIFICATION]
Timestamp: ${new Date().toISOString()}
To: ${to}
Subject: ${subject}
Status: ${status.toUpperCase()}
Event Name: ${eventName}
Content: ${
      isApproved
        ? `Congratulations! Your event "${eventName}" has been APPROVED by the Esports Calendar administrators and is now live on the public calendar!`
        : `Your event submission "${eventName}" was NOT approved.${reason ? ` Reason: ${reason}` : ""}`
    }
=================================================================
    `);

    // Optional webhook or custom API email integration hook (e.g. Resend, SendGrid, Postmark)
    if (process.env.EMAIL_WEBHOOK_URL) {
      try {
        await fetch(process.env.EMAIL_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            subject,
            eventName,
            status,
            reason,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (webhookErr) {
        console.warn("Failed to trigger EMAIL_WEBHOOK_URL:", webhookErr);
      }
    }

    return true;
  } catch (err) {
    console.error("Error in sendBookingStatusEmail:", err);
    return false;
  }
}
