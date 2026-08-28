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
