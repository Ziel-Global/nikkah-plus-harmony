import type { Database } from "@/integrations/supabase/types";

export type InterestRequestRow =
  Database["public"]["Functions"]["list_my_interest_requests"]["Returns"][number];

export type RequestStatus = Database["public"]["Enums"]["request_status_enum"];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  submitted: "Awaiting a reply",
  active_match: "Active match",
  awaiting_feedback_female: "Awaiting feedback",
  awaiting_feedback_male: "Awaiting feedback",
  closed_mutual: "Closed — proceeded together",
  closed_declined: "Closed",
  cancelled: "Cancelled",
};

export const OPEN_STATUSES: RequestStatus[] = [
  "submitted",
  "active_match",
  "awaiting_feedback_female",
  "awaiting_feedback_male",
];

export function isOpen(status: RequestStatus) {
  return OPEN_STATUSES.includes(status);
}

export function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Friendly rewrite of database-level guards (exclusivity trigger included). */
export function friendlyRequestError(message: string) {
  const lowered = message.toLowerCase();
  if (lowered.includes("active match")) {
    return "You or the other member already has an active match right now.";
  }
  if (lowered.includes("open request")) {
    return "There is already an open request between you and this member.";
  }
  return message;
}
