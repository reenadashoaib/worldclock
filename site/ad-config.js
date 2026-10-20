/*
 * Ad settings for Hourline. This is the only file you need to edit to turn ads on.
 *
 * Each ad space can show one of three things, checked in this order:
 *   1. A direct-sold ("house") creative you add under `house` below.
 *   2. A Google AdSense ad, once `adsenseClient` and that space's slot ID are filled in.
 *   3. A placeholder that says the space is available.
 *
 * IMPORTANT AdSense policy notes (read before going live):
 *   - Google does not allow AdSense ads inside pop-ups. Keep `slots.interstitial` empty
 *     and use the full-screen space for direct-sold creatives only. For Google's own
 *     full-screen ads, turn on "Vignette ads" under Auto ads in your AdSense account.
 *   - AdSense has no floating video unit. The video space plays a direct-sold video
 *     (`house.video.video`), or shows a regular display ad if you give it a slot ID.
 */
window.AD_CONFIG = {
  // Your AdSense publisher ID, e.g. "ca-pub-1234567890123456". Leave empty until approved.
  adsenseClient: "",

  // AdSense ad unit IDs (the data-ad-slot number) for each ad space.
  slots: {
    top: "",          // Top banner, 728x90 (320x100 on phones)
    railLeft: "",     // Left vertical banner, 160x600 (wide screens only)
    railRight: "",    // Right vertical banner, 300x600 (laptop screens and up)
    infeed: "",       // Banner inside the clock list, 728x90 (320x100 on phones)
    tile1: "",        // Tile ads, 300x250
    tile2: "",
    tile3: "",
    article: "",      // Inside the guide text, 336x280 (300x250 on phones)
    bottom: "",       // Bottom banner, 728x90 (320x100 on phones)
    video: "",        // Bottom-right dock, 320x180 – display ad only, see note above
    interstitial: ""  // Leave empty: AdSense is not allowed in pop-ups
  },

  // Direct-sold creatives. Each entry overrides AdSense for that space.
  // Image example:  top: { image: "/ads/acme-728x90.png", href: "https://acme.example", alt: "Acme travel insurance" }
  // Video example:  video: { video: "/ads/acme.mp4", poster: "/ads/acme.jpg", href: "https://acme.example", alt: "Acme" }
  house: {},

  // Where an "Advertise here" link in empty spaces should go. Leave empty for no link.
  advertiseUrl: "",

  // Bottom-right video ad.
  videoDock: {
    enabled: true,
    delaySeconds: 4
  },

  // Full-screen ad. Shown at most once per visit, and can be closed straight away.
  interstitial: {
    enabled: true,
    delaySeconds: 20
  }
};
