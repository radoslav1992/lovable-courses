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

  /** Shown in the FAQ answer about the next session. */
  nextSessionDate: 'Обяви се скоро — дата получаваш на имейл',

  /** Lead magnet name, referenced near the signup forms and in the welcome email. */
  leadMagnetTitle: '10 готови промпта за Lovable',

  /** Where the welcome email points to. */
  leadMagnetPath: '/bonus',
} as const;
