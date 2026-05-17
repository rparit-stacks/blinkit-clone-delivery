const BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const TOKEN_KEY = "delivery_token";
const READ_KEY  = "notifications-read:delivery";

function authHeaders(): Record<string, string> {
  const t = localStorage.getItem(TOKEN_KEY);
  return t
    ? { Authorization: `Bearer ${t}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

export type NotificationType =
  | "WELCOME"
  | "LOGIN"
  | "DELIVERY_ASSIGNED"
  | "DELIVERY_ACCEPTED"
  | "DELIVERY_REJECTED"
  | "DELIVERY_MISSED"
  | "DELIVERY_STATUS"
  | "DELIVERY_STATUS_SELF"
  | "DELIVERY_APPROVED"
  | "DELIVERY_BLOCKED"
  | "DELIVERY_UNBLOCKED"
  | "DELIVERY_REGISTERED"
  | "KYC_VERIFIED"
  | "KYC_REJECTED"
  | "EARNING_CREDITED"
  | "WALLET_CREDIT"
  | "WALLET_DEBIT"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_REJECTED"
  | "PENALTY_ISSUED"
  | "WARNING_ISSUED"
  | "INCENTIVE_REWARDED"
  | "ADMIN_ANNOUNCEMENT"
  | "ADMIN_MESSAGE"
  | string;

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  time: string;
  type?: NotificationType;
  relatedEntityKind?: string;
  relatedEntityId?: string;
  imageUrl?: string;
};

/** Category mapping for grouping/icons in the UI */
export type NotifCategory = "order" | "wallet" | "account" | "announcement" | "general";

export function getNotifCategory(type?: NotificationType): NotifCategory {
  if (!type) return "general";
  if (["DELIVERY_ASSIGNED", "DELIVERY_ACCEPTED", "DELIVERY_REJECTED", "DELIVERY_MISSED",
       "DELIVERY_STATUS", "DELIVERY_STATUS_SELF", "DELIVERY_PICKUP_REMINDER"].includes(type)) return "order";
  if (["EARNING_CREDITED", "WALLET_CREDIT", "WALLET_DEBIT",
       "WITHDRAWAL_APPROVED", "WITHDRAWAL_REJECTED",
       "PENALTY_ISSUED", "INCENTIVE_REWARDED"].includes(type)) return "wallet";
  if (["WELCOME", "LOGIN", "DELIVERY_APPROVED", "DELIVERY_BLOCKED", "DELIVERY_UNBLOCKED",
       "DELIVERY_REGISTERED", "KYC_VERIFIED", "KYC_REJECTED", "WARNING_ISSUED"].includes(type)) return "account";
  if (["ADMIN_ANNOUNCEMENT", "ADMIN_MESSAGE"].includes(type)) return "announcement";
  return "general";
}

// ─── Client-side read state (localStorage) ───────────────────────────────────

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  // Cap to last 500 IDs to avoid unbounded localStorage growth
  const arr = [...ids];
  const trimmed = arr.length > 500 ? arr.slice(arr.length - 500) : arr;
  localStorage.setItem(READ_KEY, JSON.stringify(trimmed));
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchNotifications(limit = 50): Promise<NotificationItem[]> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/delivery/notifications?limit=${limit}`, { headers: authHeaders() });
  } catch {
    return [];
  }
  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Server error (HTTP ${res.status})`);
  }
  if (!res.ok || json.success === false) {
    throw new Error((json.message as string) ?? `HTTP ${res.status}`);
  }
  const readIds = getReadIds();
  return ((json.data as Record<string, unknown>)?.items as NotificationItem[] ?? []).map((n: NotificationItem) => ({
    ...n,
    read: readIds.has(n.id) || n.read,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  const ids = getReadIds();
  ids.add(id);
  saveReadIds(ids);
}

export async function markAllNotificationsRead(): Promise<void> {
  const items = await fetchNotifications();
  saveReadIds(new Set(items.map((n) => n.id)));
}

export function getUnreadCount(items: NotificationItem[]): number {
  return items.filter((n) => !n.read).length;
}
