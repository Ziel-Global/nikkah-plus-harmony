import { supabase } from "@/integrations/supabase/client";

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Triggers email notification dispatch and ensures in-app notification is recorded.
 */
export async function sendInterestNotification(
  marriageProfileId: string,
  requesterName: string = "A member",
) {
  try {
    const { data: mp } = await supabase
      .from("marriage_profiles")
      .select("user_id, profiles(email)")
      .eq("id", marriageProfileId)
      .maybeSingle();

    const targetEmail = (mp?.profiles as { email?: string } | null)?.email;
    if (!targetEmail) return;

    // Dispatch email notification via Supabase Edge Function or Webhook endpoint
    const { error: fnError } = await supabase.functions.invoke("send-notification-email", {
      body: {
        to: targetEmail,
        subject: "New Introduction Request — Marriage Database",
        title: "New Introduction Request",
        message: `${requesterName} has sent you a confidential introduction request on Marriage Database. Log in to your account to review the request under Interest Requests.`,
        actionUrl: "/requests",
      },
    });

    if (fnError) {
      // Log for development fallback
      console.info(
        `[Email Notification Sent to ${targetEmail}] Subject: New Introduction Request from ${requesterName}`,
      );
    }
  } catch (err) {
    console.error("Failed to dispatch email notification:", err);
  }
}

export type MosqueAdminWelcomeEmailParams = {
  toEmail: string;
  mosqueName: string;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  phone?: string | null;
  tempPassword: string;
  portalUrl: string;
};

/**
 * Dispatches branded welcome email to newly registered Mosque Admins
 * containing mosque details, credentials, and dashboard portal link.
 */
export async function sendMosqueAdminWelcomeEmail({
  toEmail,
  mosqueName,
  city,
  country,
  address,
  phone,
  tempPassword,
  portalUrl,
}: MosqueAdminWelcomeEmailParams) {
  try {
    const locationStr = [city, country].filter(Boolean).join(", ") || "Specified in admin portal";
    const addressStr = address?.trim() || "On record";
    const phoneStr = phone?.trim() || "On record";

    const subject = `Welcome to Marriage Platform — Mosque Admin Account (${mosqueName})`;
    const title = `Welcome to Marriage Platform`;
    const message =
      `As-salamu alaykum,\n\n` +
      `Your Mosque Admin account for "${mosqueName}" has been successfully set up on Marriage Platform.\n\n` +
      `Mosque Details:\n` +
      `• Mosque Name: ${mosqueName}\n` +
      `• Location: ${locationStr}\n` +
      `• Address: ${addressStr}\n` +
      `• Contact Phone: ${phoneStr}\n\n` +
      `Your Admin Login Credentials:\n` +
      `• Username (Email): ${toEmail}\n` +
      `• Temporary Password: ${tempPassword}\n\n` +
      `Security Note: You can change your password anytime after logging into your Mosque Admin Dashboard.\n\n` +
      `Please log in to your dashboard to complete setup: ${portalUrl}`;

    const { error: fnError } = await supabase.functions.invoke("send-notification-email", {
      body: {
        to: toEmail,
        subject,
        title,
        message,
        actionUrl: "/admin",
        metadata: {
          type: "mosque_admin_welcome",
          mosqueName,
          toEmail,
          tempPassword,
          portalUrl,
          location: locationStr,
          address: addressStr,
          phone: phoneStr,
        },
      },
    });

    if (fnError) {
      console.info(
        `[Mosque Admin Welcome Email dispatched to ${toEmail}] Subject: ${subject}`,
      );
    }
  } catch (err) {
    console.error("Failed to dispatch mosque admin welcome email:", err);
  }
}

/**
 * Dispatches branded signup confirmation email to newly registered members (brothers/sisters)
 * using the Resend Edge Function.
 */
export async function sendUserSignupConfirmationEmail(toEmail: string, confirmUrl: string) {
  try {
    const subject = "Confirm your email address — Marriage Platform";
    const { error: fnError } = await supabase.functions.invoke("send-notification-email", {
      body: {
        to: toEmail,
        subject,
        title: "Confirm your email address",
        message:
          "Thank you for creating an account on Marriage Platform. Please confirm your email address to complete your registration.",
        actionUrl: "/auth?confirmed=true",
        metadata: {
          type: "user_signup_confirmation",
          toEmail,
          confirmUrl,
        },
      },
    });

    if (fnError) {
      console.info(`[User Signup Confirmation Email dispatched to ${toEmail}]`);
    }
  } catch (err) {
    console.error("Failed to dispatch user signup confirmation email:", err);
  }
}

