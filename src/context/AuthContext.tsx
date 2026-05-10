import { createContext, useContext, useState, type ReactNode } from "react";
import { setToken, clearToken, type DeliveryAuthResponse } from "../api/deliveryApi";

interface AuthState {
  token: string | null;
  partner: Omit<DeliveryAuthResponse, "token"> | null;
}

interface AuthCtx extends AuthState {
  login: (resp: DeliveryAuthResponse) => void;
  logout: () => void;
  updatePartnerInfo: (info: Partial<Omit<DeliveryAuthResponse, "token">>) => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function loadState(): AuthState {
  try {
    const token = localStorage.getItem("delivery_token");
    const raw = localStorage.getItem("delivery_info");
    if (token && raw) return { token, partner: JSON.parse(raw) };
  } catch {}
  return { token: null, partner: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadState);

  const login = (resp: DeliveryAuthResponse) => {
    const { token, ...partner } = resp;
    setToken(token);
    localStorage.setItem("delivery_info", JSON.stringify(partner));
    setState({ token, partner });
  };

  const logout = () => {
    clearToken();
    setState({ token: null, partner: null });
  };

  const updatePartnerInfo = (info: Partial<Omit<DeliveryAuthResponse, "token">>) => {
    setState(prev => {
      if (!prev.partner) return prev;
      const updated = { ...prev.partner, ...info };
      localStorage.setItem("delivery_info", JSON.stringify(updated));
      return { ...prev, partner: updated };
    });
  };

  return (
    <Ctx.Provider value={{ ...state, login, logout, updatePartnerInfo }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
