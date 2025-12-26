/**
 * Email utility functions for sending transactional emails
 */

type EmailType = "welcome" | "checkin_reminder" | "weekly_summary";

interface SendEmailOptions {
  type: EmailType;
  to: string | string[];
  data?: Record<string, any>;
}

/**
 * Send an email using the internal API
 * This can be called from server components or API routes
 */
export async function sendEmail({ type, to, data }: SendEmailOptions) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://willpowered.com";
  
  try {
    const response = await fetch(`${baseUrl}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, to, data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, userName: string) {
  return sendEmail({
    type: "welcome",
    to: email,
    data: { userName },
  });
}

/**
 * Send check-in reminder email
 */
export async function sendCheckinReminder(
  email: string,
  userName: string,
  streakDays?: number
) {
  return sendEmail({
    type: "checkin_reminder",
    to: email,
    data: { userName, streakDays },
  });
}

/**
 * Send weekly summary email
 */
export async function sendWeeklySummary(
  email: string,
  data: {
    userName: string;
    weekNumber: number;
    checkinsCompleted: number;
    totalDays: number;
    metrics: Array<{
      name: string;
      achieved: number;
      target: number;
      unit?: string;
    }>;
    aiInsight?: string;
  }
) {
  return sendEmail({
    type: "weekly_summary",
    to: email,
    data,
  });
}

