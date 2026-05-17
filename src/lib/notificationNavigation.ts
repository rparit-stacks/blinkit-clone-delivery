import type { NotificationType } from "./notificationsApi";

/**
 * Resolve in-app route from FCM / push data (delivery partner app).
 * Handles all notification types and entity kinds.
 */
export function resolveNotificationPath(data: {
  clickUrl?: string;
  relatedEntityKind?: string;
  relatedEntityId?: string;
  entityKind?: string;
  entityId?: string;
  type?: NotificationType | string;
}): string {
  // Explicit click URL from admin/push payload takes highest precedence
  const clickUrl = data.clickUrl?.trim();
  if (clickUrl) {
    const allowed = ["/dashboard", "/assignments", "/wallet", "/profile", "/notifications"];
    if (allowed.some((p) => clickUrl === p || clickUrl.startsWith(p + "/"))) {
      return clickUrl;
    }
  }

  const kind = data.relatedEntityKind ?? data.entityKind ?? "";
  const id   = data.relatedEntityId   ?? data.entityId   ?? "";
  const type = data.type ?? "";

  // Order / delivery assignment — navigate to specific assignment
  if (kind === "DELIVERY_ASSIGNMENT" && id) return `/assignments/${id}`;

  // Wallet-related → wallet page
  if (
    kind === "WITHDRAWAL" ||
    ["EARNING_CREDITED", "WALLET_CREDIT", "WALLET_DEBIT",
     "WITHDRAWAL_APPROVED", "WITHDRAWAL_REJECTED", "PENALTY_ISSUED",
     "INCENTIVE_REWARDED"].includes(type)
  ) {
    return "/wallet";
  }

  // Profile / account → profile page
  if (
    kind === "DELIVERY_PARTNER" ||
    ["WELCOME", "DELIVERY_APPROVED", "DELIVERY_BLOCKED", "DELIVERY_UNBLOCKED",
     "KYC_VERIFIED", "KYC_REJECTED", "WARNING_ISSUED"].includes(type)
  ) {
    return "/profile";
  }

  // Missed / rejected delivery — just go to assignments list
  if (["DELIVERY_MISSED", "DELIVERY_REJECTED", "DELIVERY_ASSIGNED"].includes(type)) {
    return "/assignments";
  }

  // Fallback
  return "/notifications";
}

export function dispatchNotificationNavigate(path: string): void {
  window.dispatchEvent(
    new CustomEvent("naini-notification-navigate", { detail: { path } })
  );
}
