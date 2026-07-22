/**
 * API client for Shadow Nexus with dynamic LAN IP resolution and automatic token management.
 * Prevents stale tokens, unauthorized mock fallbacks, and connection errors across physical devices & Expo Go.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import { storage } from "@/src/utils/storage";

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1") && !envUrl.includes("10.0.2.2")) {
    return envUrl.replace(/\/$/, "");
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const host = window.location.hostname || "localhost";
    return `http://${host}:8001`;
  }

  // Detect local IP of host computer via Expo Constants for physical phone / Expo Go
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost || (Constants as any).manifest2?.extra?.expoGo?.developer?.manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:8001`;
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8001";
  }

  return "http://localhost:8001";
}

const TOKEN_KEY = "sn_token";

export async function getToken(): Promise<string | null> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  // Prevent any stale mock tokens from ever being sent to the real backend
  if (!token || token === "mock_session_token_123") {
    return null;
  }
  return token;
}

export async function setToken(token: string): Promise<void> {
  if (token && token !== "mock_session_token_123") {
    await storage.secureSet(TOKEN_KEY, token);
  }
}

export async function clearToken(): Promise<void> {
  await storage.secureRemove(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const primaryBase = getBaseUrl();
  const primaryUrl = `${primaryBase}/api${path}`;

  try {
    const res = await fetch(primaryUrl, { ...init, headers });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      // Automatic token purge on 401 Unauthorized
      if (res.status === 401) {
        await clearToken();
      }
      const msg = (data && (data.detail || data.message)) || res.statusText;
      throw new ApiError(typeof msg === "string" ? msg : "Request failed", res.status);
    }
    return data as T;
  } catch (primaryErr: any) {
    // If 401, throw directly without retrying or mocking
    if (primaryErr instanceof ApiError && primaryErr.status === 401) {
      await clearToken();
      throw primaryErr;
    }

    // Attempt Render cloud failover if network was unreachable
    if (!primaryUrl.includes("onrender.com") && !(primaryErr instanceof ApiError)) {
      const fallbackUrl = `https://shadow-backend-5amv.onrender.com/api${path}`;
      try {
        const res = await fetch(fallbackUrl, { ...init, headers });
        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        if (res.ok) return data as T;
        if (res.status === 401) {
          await clearToken();
          throw new ApiError("Session expired", 401);
        }
      } catch (fallbackErr: any) {
        if (fallbackErr instanceof ApiError && fallbackErr.status === 401) {
          await clearToken();
          throw fallbackErr;
        }
      }
    }

    // Re-throw genuine network or API errors
    throw primaryErr;
  }
}

export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, body?: any) => request<T>(p, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(p: string, body?: any) => request<T>(p, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  del: <T>(p: string) => request<T>(p, { method: "DELETE" }),
};
