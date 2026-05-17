import { getToken } from "../api/deliveryApi";
import { isNativeApp } from "./nativeApp";

const REGISTERED_KEY = "delivery_fcm_registered";
const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function registerTokenWithBackend(token: string): Promise<void> {
  const storageKey = `${REGISTERED_KEY}:${token.slice(0, 12)}`;
  if (localStorage.getItem(storageKey) === token) return;
  try {
    const authToken = getToken();
    const res = await fetch(`${BASE}/api/delivery/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    localStorage.setItem(storageKey, token);
  } catch (e) {
    console.warn("Failed to register delivery push token:", e);
  }
}

function waitForNativeFcmToken(timeoutMs = 8000): Promise<string | null> {
  if (!isNativeApp()) return Promise.resolve(null);

  if (window.__nativeFcmToken) return Promise.resolve(window.__nativeFcmToken);

  try {
    const bridge = window.AndroidBridge?.getFcmToken?.();
    if (bridge) {
      window.__nativeFcmToken = bridge;
      return Promise.resolve(bridge);
    }
  } catch {
    /* bridge not ready */
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = (t: string | null) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.removeEventListener("naini-native-fcm-token", onToken);
      resolve(t);
    };

    const onToken = (e: Event) => {
      const token = (e as CustomEvent<{ token: string }>).detail?.token;
      if (token) {
        window.__nativeFcmToken = token;
        finish(token);
      }
    };

    window.__onNativeFcmToken = (token: string) => {
      window.__nativeFcmToken = token;
      finish(token);
    };

    const timer = window.setTimeout(() => finish(window.__nativeFcmToken ?? null), timeoutMs);
    window.addEventListener("naini-native-fcm-token", onToken);
  });
}

export async function initPushNotifications(): Promise<void> {
  if (!getToken()) return;
  if (!isNativeApp()) return;

  const token = await waitForNativeFcmToken();
  if (token) await registerTokenWithBackend(token);
}

export function subscribeNativePushTokenRefresh(): () => void {
  if (!isNativeApp()) return () => {};

  const onToken = async (e: Event) => {
    if (!getToken()) return;
    const token = (e as CustomEvent<{ token: string }>).detail?.token;
    if (token) await registerTokenWithBackend(token);
  };

  window.addEventListener("naini-native-fcm-token", onToken);
  return () => window.removeEventListener("naini-native-fcm-token", onToken);
}

export function clearDeliveryPushRegistration(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(REGISTERED_KEY))
    .forEach((k) => localStorage.removeItem(k));
}
