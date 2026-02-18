import * as CookieConsent from "vanilla-cookieconsent";

/**
 * CookieConsent (https://cookieconsent.orestbida.com/) config with an analytics category.
 * Pass this to CookieConsent.run() from the root layout (see tasks 1.2 / 1.3).
 * The plugin persists the user's choice in its own cookie.
 */
const ANALYTICS_CATEGORY = "analytics";

/** Custom event name for consent changes. Listen for this to know when to load GA (task 2.2). */
export const COOKIECONSENT_CHANGE_EVENT = "cookieconsent:change";

function dispatchConsentChange() {
  if (typeof document === "undefined") return;
  document.dispatchEvent(
    new CustomEvent(COOKIECONSENT_CHANGE_EVENT, {
      detail: {
        analyticsAccepted: CookieConsent.acceptedCategory(ANALYTICS_CATEGORY),
      },
    }),
  );
}

export const cookieConsentConfig: Parameters<typeof CookieConsent.run>[0] = {
  categories: {
    necessary: {
      enabled: true,
      readOnly: true,
    },
    analytics: {},
  },
  onConsent: () => {
    dispatchConsentChange();
  },
  onChange: () => {
    dispatchConsentChange();
  },
  language: {
    default: "en",
    translations: {
      en: {
        consentModal: {
          title: "We use cookies",
          description:
            "We use cookies for analytics to understand how you use the site. You can accept or reject non-essential cookies.",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
        },
        preferencesModal: {
          title: "Cookie preferences",
          acceptAllBtn: "Accept all",
          acceptNecessaryBtn: "Reject all",
          sections: [],
        },
      },
    },
  },
};

/**
 * Returns true if the user has accepted the analytics category via CookieConsent.
 * Only meaningful after CookieConsent.run() has been called; before that, returns false
 * (no consent = do not load GA).
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return CookieConsent.acceptedCategory(ANALYTICS_CATEGORY);
}
