"use client";

import { useEffect } from "react";
import { shouldRegisterServiceWorker } from "@/lib/pwa";

const SW_PATH = "/service-worker.js";
const SW_URL = `${SW_PATH}?v=7`;
const RELOAD_GUARD = "mst_sw_reload_v7";

async function unregisterAllWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
}

async function unregisterForeignWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.map(async (reg) => {
      const script =
        reg.active?.scriptURL ||
        reg.installing?.scriptURL ||
        reg.waiting?.scriptURL ||
        "";
      if (!script.includes(SW_PATH)) {
        await reg.unregister();
      }
    }),
  );
}

/** Soft-reload once when a new SW takes control (logo / assets update). */
function softReloadForUpdate() {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD) === "1") return;
    sessionStorage.setItem(RELOAD_GUARD, "1");
  } catch {
    // private mode
  }
  window.location.reload();
}

/**
 * Registers a network-only service worker for PWA installability.
 * On local HTTP dev, only cleans leftover workers (no registration).
 * When SW updates, pages reload once so logos apply without manual refresh.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    let removeFocus: (() => void) | undefined;
    let intervalId: number | undefined;

    const onControllerChange = () => {
      softReloadForUpdate();
    };

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | undefined;
      if (data?.type === "SW_ACTIVATED") {
        softReloadForUpdate();
      }
    };

    void (async () => {
      try {
        if (!shouldRegisterServiceWorker()) {
          await unregisterAllWorkers();
          return;
        }

        if (cancelled) return;

        await unregisterForeignWorkers();
        if (cancelled) return;

        // Clear one-shot guard after successful boot on this version
        try {
          sessionStorage.removeItem(RELOAD_GUARD);
        } catch {
          // ignore
        }

        navigator.serviceWorker.addEventListener(
          "controllerchange",
          onControllerChange,
        );
        navigator.serviceWorker.addEventListener("message", onMessage);

        const reg = await navigator.serviceWorker.register(SW_URL, {
          scope: "/",
          updateViaCache: "none",
        });

        const checkUpdate = () => {
          void reg.update();
        };

        // Pick up new SW quickly after deploy
        checkUpdate();

        const onFocus = () => checkUpdate();
        const onVisibility = () => {
          if (document.visibilityState === "visible") checkUpdate();
        };

        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisibility);
        intervalId = window.setInterval(checkUpdate, 30 * 60 * 1000);

        removeFocus = () => {
          window.removeEventListener("focus", onFocus);
          document.removeEventListener("visibilitychange", onVisibility);
        };
      } catch {
        // SW registration failures must never break the app.
      }
    })();

    return () => {
      cancelled = true;
      removeFocus?.();
      if (intervalId !== undefined) window.clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
