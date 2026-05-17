const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** Build href for uploaded files (KYC). Uses `VITE_API_BASE_URL` when set; otherwise same-origin path. */
export function resolveMediaUrl(relativeOrAbsolute: string): string {
  if (!relativeOrAbsolute) return "#";
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  const path = relativeOrAbsolute.startsWith("/") ? relativeOrAbsolute : `/${relativeOrAbsolute}`;
  if (BASE) return `${BASE.replace(/\/$/, "")}${path}`;
  return path;
}

const TOKEN_KEY = "delivery_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("delivery_info");
};

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(init.headers ?? {}) },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.message ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

const get = <T,>(path: string) => request<T>(path);
const post = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
const put = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
const patch = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeliveryAuthResponse {
  token: string;
  partnerId: string;
  name: string;
  phone: string;
  status: string;
  vehicleType: string;
  online: boolean;
}

export interface DeliveryProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  profileImage?: string;
  vehicleType: string;
  vehicleNumber: string;
  status: "PENDING" | "APPROVED" | "BLOCKED";
  online: boolean;
  active: boolean;
  totalDeliveries: number;
  rating: number;
  idProofUrl?: string;
  vehicleImageUrl?: string;
  licenseUrl?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  upiId?: string;
  createdAt: string;
}

export interface DeliveryAssignment {
  id: string;
  displayId: string;
  subOrderId: string;
  masterOrderId: string;
  deliveryPartnerId: string;
  sellerId: string;
  storeId: string;
  customerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  sellerStoreName: string;
  sellerPhone?: string;
  customerName?: string;
  customerPhone?: string;
  orderSummary: string;
  paymentMode: string;
  paid: boolean;
  orderTotal: number;
  deliveryFee: number;
  status: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletInfo {
  id: string;
  ownerId: string;
  ownerType: string;
  balance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeWithdrawn: number;
  active: boolean;
  updatedAt: string;
}

export interface WalletTx {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  ownerId: string;
  ownerType: string;
  amount: number;
  status: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  upiId?: string;
  adminNote?: string;
  utrReference?: string;
  createdAt: string;
  processedAt?: string;
}

export interface DashboardStats {
  activeDeliveries: number;
  completedDeliveries: number;
  earningsTodayPaise: number;
  totalEarningsPaise: number;
  walletBalancePaise: number;
}

// ─── OTP ─────────────────────────────────────────────────────────────────────
export const deliverySendOtp = (email: string) =>
  post<{ otp?: string }>("/api/delivery/auth/send-otp", { email });
export const deliveryVerifyOtp = (email: string, otp: string) =>
  post<{ verified: string }>("/api/delivery/auth/verify-otp", { email, otp });

// ─── File upload ─────────────────────────────────────────────────────────────
export async function uploadFile(file: File, folder = "delivery-docs"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message ?? "Upload failed");
  return json.data.url as string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const deliveryLogin = (phone: string, password: string) =>
  post<DeliveryAuthResponse>("/api/delivery/auth/login", { phone, password });

export const deliveryRegister = (data: {
  name: string; phone: string; email?: string; password: string;
  vehicleType?: string; vehicleNumber?: string;
}) => post<DeliveryAuthResponse>("/api/delivery/auth/register", data);

// ─── Profile ──────────────────────────────────────────────────────────────────
export const fetchProfile = () => get<DeliveryProfile>("/api/delivery/profile");
export const updateProfile = (data: Partial<DeliveryProfile>) =>
  put<DeliveryProfile>("/api/delivery/profile", data);
export const toggleOnline = () =>
  post<DeliveryProfile>("/api/delivery/toggle-online", {});

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const fetchDashboard = () => get<DashboardStats>("/api/delivery/dashboard");

// ─── Assignments ──────────────────────────────────────────────────────────────
export const fetchAssignments = (status?: string) =>
  get<DeliveryAssignment[]>(`/api/delivery/assignments${status ? `?status=${status}` : ""}`);
export const fetchAssignment = (id: string) =>
  get<DeliveryAssignment>(`/api/delivery/assignments/${id}`);
export const updateAssignmentStatus = (id: string, status: string) =>
  patch<DeliveryAssignment>(`/api/delivery/assignments/${id}/status`, { status });

// ─── Wallet ───────────────────────────────────────────────────────────────────
export const fetchWallet = () => get<WalletInfo>("/api/delivery/wallet");
export const fetchTransactions = (page = 0, size = 30) =>
  get<WalletTx[]>(`/api/delivery/wallet/transactions?page=${page}&size=${size}`);
export const fetchWithdrawals = () => get<Withdrawal[]>("/api/delivery/wallet/withdrawals");
export const requestWithdrawal = (data: {
  amountPaise: number;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankAccountHolderName?: string;
  bankName?: string;
  upiId?: string;
}) => post<Withdrawal>("/api/delivery/wallet/withdraw", data);
