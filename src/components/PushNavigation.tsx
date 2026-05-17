import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { onNativeDeepLink } from "../lib/nativeApp";
import {
  initPushNotifications,
  subscribeNativePushTokenRefresh,
} from "../lib/pushNotifications";

/** Registers FCM + handles notification tap deep links inside authenticated routes. */
export default function PushNavigation() {
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    initPushNotifications().catch(() => {});

    const go = (path: string) => {
      if (path.startsWith("/")) navigate(path);
    };

    const onPushNavigate = (e: Event) => {
      const path = (e as CustomEvent<{ path: string }>).detail?.path;
      if (path) go(path);
    };

    window.addEventListener("naini-notification-navigate", onPushNavigate);
    const unsubDeepLink = onNativeDeepLink(go);
    const unsubToken = subscribeNativePushTokenRefresh();

    return () => {
      unsubDeepLink();
      unsubToken();
      window.removeEventListener("naini-notification-navigate", onPushNavigate);
    };
  }, [token, navigate]);

  return null;
}
