import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppSplash from "./AppSplash";
import type { ReactNode } from "react";

const BOOT_KEY = "delivery_app_booted";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [booting, setBooting] = useState(() => {
    if (!token) return false;
    return !sessionStorage.getItem(BOOT_KEY);
  });

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return;
    }
    if (sessionStorage.getItem(BOOT_KEY)) {
      setBooting(false);
      return;
    }
    const t = window.setTimeout(() => {
      sessionStorage.setItem(BOOT_KEY, "1");
      setBooting(false);
    }, 900);
    return () => window.clearTimeout(t);
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  if (booting) return <AppSplash />;
  return <>{children}</>;
}
