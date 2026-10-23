import { signOut } from "next-auth/react";

// Safe inactivity session timeout: 24 Hours (1 Day)
// - If user closes/cuts tab and returns within 24 hours: stays logged in smoothly.
// - If user is away for > 24 continuous hours: session expires safely.
// - 0% server/database load (pure client-side comparison).
export const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Hours

export function recordUserActivity() {
  if (typeof window === "undefined") return;
  try {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      localStorage.setItem("lastActiveTime", Date.now().toString());
      sessionStorage.removeItem("justLoggedOutDueToInactivity");
    }
  } catch (_) {}
}

export function checkSessionInactivity(router) {
  if (typeof window === "undefined") return false;
  try {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") return false;

    const lastActiveStr = localStorage.getItem("lastActiveTime");
    const now = Date.now();

    if (lastActiveStr) {
      const lastActive = Number(lastActiveStr);
      if (!isNaN(lastActive) && now - lastActive > INACTIVITY_TIMEOUT_MS) {
        console.warn("[Auth] Session expired after 24 hours of inactivity.");
        sessionStorage.setItem("justLoggedOutDueToInactivity", "true");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("lastActiveTime");

        try {
          signOut({ redirect: false });
        } catch (_) {}

        if (router && router.pathname !== "/login" && router.pathname !== "/signup") {
          router.push("/login?reason=inactivity");
        }
        return true; // Expired
      }
    } else {
      // First time initialization for existing active sessions
      localStorage.setItem("lastActiveTime", now.toString());
      return false;
    }

    // Still active: Refresh activity timestamp
    localStorage.setItem("lastActiveTime", now.toString());
    return false;
  } catch (_) {
    return false;
  }
}

export function clearUserSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("lastActiveTime");
    sessionStorage.removeItem("justLoggedOutDueToInactivity");
  } catch (_) {}
}

