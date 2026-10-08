"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AppEmbedHandler() {
  const pathname = usePathname();
  const router = useRouter();

  // 1. Detect embedding with window.self !== window.top in a client effect (no hydration mismatch)
  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      document.documentElement.setAttribute("data-embedded", "true");
    }
  }, []);

  // 2. Post route change to window.parent on every route change
  useEffect(() => {
    if (typeof window !== "undefined" && window.self !== window.top) {
      window.parent.postMessage({ type: "bawsala:route", path: pathname }, "*");
    }
  }, [pathname]);

  // 3. Listen to navigation requests from the parent shell
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data &&
        typeof e.data === "object" &&
        e.data.type === "bawsala:navigate" &&
        typeof e.data.path === "string"
      ) {
        router.push(e.data.path);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router]);

  // 4. Forward keyboard shortcuts when iframe has focus
  useEffect(() => {
    if (typeof window === "undefined" || window.self === window.top) return;

    const handleChildKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (["r", "R", "d", "D", "p", "P", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        window.parent.postMessage({ type: "bawsala:key", key: e.key }, "*");
      }
    };

    window.addEventListener("keydown", handleChildKeyDown);
    return () => window.removeEventListener("keydown", handleChildKeyDown);
  }, []);

  return null;
}
