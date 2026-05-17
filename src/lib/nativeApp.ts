export function isNativeApp(): boolean {
  return typeof window !== "undefined" && !!window.AndroidBridge?.isNativeApp?.();
}

declare global {
  interface Window {
    AndroidBridge?: {
      isNativeApp: () => boolean;
      getFcmToken: () => string;
      vibrate?: () => void;
    };
    __nativeFcmToken?: string;
    __onNativeFcmToken?: (token: string) => void;
    __pendingNativeDeepLink?: string;
  }
}

/** React Router navigation when user taps a native push notification. */
export function onNativeDeepLink(handler: (path: string) => void): () => void {
  const run = (path: string) => {
    if (path.startsWith("/")) handler(path);
  };

  const pending = window.__pendingNativeDeepLink;
  if (pending) {
    run(pending);
    delete window.__pendingNativeDeepLink;
  }

  const onEvent = (e: Event) => {
    const path = (e as CustomEvent<{ path: string }>).detail?.path;
    if (path) run(path);
  };

  window.addEventListener("naini-native-deeplink", onEvent);
  return () => window.removeEventListener("naini-native-deeplink", onEvent);
}
