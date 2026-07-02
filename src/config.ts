/**
 * Site-wide settings you'll want to touch without digging through components.
 */
export const siteConfig = {
  /**
   * Cloudflare Web Analytics beacon token.
   * Dashboard → Analytics & Logs → Web Analytics → Add a site → copy the token.
   * Leave empty to disable (no script is injected).
   */
  cfBeaconToken: '',

  /**
   * Facebook (Meta) Pixel ID. Loaded only after cookie consent.
   * Leave empty to disable.
   */
  fbPixelId: '',

  /**
   * Google tag ID for Google Ads, e.g. "AW-123456789".
   * Loaded only after cookie consent. Leave empty to disable.
   */
  googleTagId: '',

  /**
   * Google Ads conversion label for the signup event (the part after the
   * slash in "AW-123456789/AbCdEfGh"). Leave empty to send only the
   * generic generate_lead event.
   */
  googleAdsConversionLabel: '',

  /**
   * Cloudflare Turnstile site key (Dashboard → Turnstile → Add widget).
   * Leave empty to disable the widget. When set, also set the Worker secret:
   *   npx wrangler secret put TURNSTILE_SECRET_KEY
   */
  turnstileSiteKey: '',

  /** Shown in the FAQ answer about the next session. */
  nextSessionDate: 'Обяви се скоро — дата получаваш на имейл',

  /** Lead magnet name, referenced near the signup forms and in the welcome email. */
  leadMagnetTitle: '10 готови промпта за Lovable',

  /** Where the welcome email points to. */
  leadMagnetPath: '/bonus',
} as const;
