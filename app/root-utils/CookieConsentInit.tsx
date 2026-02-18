import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { cookieConsentConfig } from "./cookie-consent";

/**
 * Initializes CookieConsent from the root layout. The banner is shown when no stored
 * choice exists; Accept all / Reject all (and Manage preferences) are provided by the config.
 */
export function CookieConsentInit() {
  useEffect(() => {
    CookieConsent.run(cookieConsentConfig);
  }, []);

  return null;
}
