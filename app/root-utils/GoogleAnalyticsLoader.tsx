import { useEffect, useRef } from "react";
import {
  COOKIECONSENT_CHANGE_EVENT,
  hasAnalyticsConsent,
} from "../lib/cookie-consent";

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as
  | string
  | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function loadGoogleAnalytics(measurementId: string) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (document.getElementById("gtag-script")) return;

  window.dataLayer = window.dataLayer ?? [];
  function gtag() {
    window.dataLayer.push(arguments);
  }

  window.gtag = gtag;
  // @ts-expect-error the original gtag function uses arguments instead of ...args
  gtag("js", new Date());
  // @ts-expect-error
  gtag("config", measurementId);

  const script = document.createElement("script");
  script.id = "gtag-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

/**
 * Injects gtag.js only when VITE_GA_MEASUREMENT_ID is set and the user has
 * consented to analytics. Listens for consent changes so GA loads after accept.
 */
export function GoogleAnalyticsLoader() {
  const loadedRef = useRef(false);

  useEffect(() => {
    const id =
      typeof MEASUREMENT_ID === "string" && MEASUREMENT_ID.trim()
        ? MEASUREMENT_ID.trim()
        : "";
    if (!id) return;

    const maybeLoad = () => {
      if (loadedRef.current) return;
      if (!hasAnalyticsConsent()) return;
      loadedRef.current = true;
      loadGoogleAnalytics(id);
    };

    maybeLoad();

    const handler = (e: CustomEvent<{ analyticsAccepted: boolean }>) => {
      if (e.detail?.analyticsAccepted) maybeLoad();
    };
    document.addEventListener(
      COOKIECONSENT_CHANGE_EVENT,
      handler as EventListener,
    );
    return () =>
      document.removeEventListener(
        COOKIECONSENT_CHANGE_EVENT,
        handler as EventListener,
      );
  }, []);

  return null;
}
