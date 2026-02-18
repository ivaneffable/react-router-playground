import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Sends one page_view to GA per location (initial load and each navigation).
 * Single effect with location in deps. gtag only exists when ID is set and
 * user has consented (see GoogleAnalyticsLoader), so we only check for gtag.
 */
export function GoogleAnalyticsPageView() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function")
      return;

    const pagePath = location.pathname + location.search;
    const pageTitle = typeof document !== "undefined" ? document.title : "";

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }, [location]);

  return null;
}
