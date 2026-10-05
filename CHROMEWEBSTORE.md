# Chrome Web Store Listing — Jupiter Kaks

> Last Updated: 2026-10-06
> Draft metadata only. This extension has not been submitted to the Chrome Web Store.

## Store Listing

**Extension Name:** Jupiter Kaks

**Short Description:** Watch Jupiter with Estonian captions and free English translations together.

**Detailed Description:**

Watch shows on Jupiter with Estonian subtitles and English translations at the same time.

Estonian appears in white and English underneath in yellow. Translations are prepared ahead, including while paused. See preparation progress, adjust subtitle size and position, and watch in fullscreen. Completed translations are saved on your device.

Open a show on jupiter.err.ee and enable its Estonian captions. Allow a few seconds for English to prepare before playing. Shows must already have selectable Estonian captions.

Caption text is sent to the University of Tartu’s Neurotõlge service for translation. No personal API key is required. Machine translations can make mistakes, and the public service may have temporary limits.

Jupiter Kaks is an independent project, unaffiliated with ERR or the University of Tartu.

**Category:** Accessibility

**Single Purpose:** Show Jupiter’s existing Estonian captions alongside English translations.

**Primary Language:** English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|------------|--------|----------|
| Store icon | 128×128 PNG | Not created | — |
| Bilingual playback screenshot | 1280×800 or 640×400 | Not created | — |
| Popup screenshot | 1280×800 or 640×400 | Not created | — |

### Screenshot Notes

Capture both subtitle languages during playback and the popup’s preparation progress. Obtain permission for any broadcast imagery used in store assets. The manifest currently omits icon references.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Save subtitle preferences, completed translations, and retry cooldowns on this device. |
| https://api.tartunlp.ai/* | host_permissions | Send caption text to Neurotõlge and receive English translations. |
| https://jupiter.err.ee/* | content_scripts matches | Read the player’s Estonian captions and subtitle segments, and display both languages inside the player. |

## Privacy & Data Use

**Does the extension collect user data?** Yes: it processes website caption text and stores preferences and translations locally.

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
|-----------|------------|------------------------|---------|---------------------------|
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | Preferences only | No | Subtitle display controls | No |
| Website content | Caption text | Yes | English translation, including upcoming captions | Neurotõlge / TartuNLP |

The extension does not transmit video, audio, account cookies, or browsing history. Neurotõlge requests include a fixed application identifier, “Jupiter Dual Subtitles”, retained for service usage consistency. The provider also receives ordinary network metadata such as the request’s IP address. Its policy is linked in README.md.

### Data Use Certification

- [x] The extension does not sell data to third parties.
- [x] The extension uses data only for subtitle translation and display.
- [x] The extension does not use data for creditworthiness or lending purposes.

## Privacy Policy

**Privacy Policy URL:** Pending. README.md documents current behavior; a complete public privacy policy is required before store submission.

## Distribution

**Store visibility:** Undecided. The GitHub repository is intended to be public.

**Regions:** Undecided.

## Developer Info

**Publisher Name:** Pending.

**Contact Email:** Pending.

**Support URL:** https://github.com/muhammednagy/jupiter-kaks/issues

**Homepage URL:** https://github.com/muhammednagy/jupiter-kaks

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.2.1 | 2026-10-06 | Rename to Jupiter Kaks; prepare project documentation for GitHub. | Local draft |
| 1.2.0 | 2026-10-06 | Use Neurotõlge batch translation with persistent cooldowns. | Local |
| 1.1.0 | 2026-10-06 | Prepare English captions ahead of playback, including while paused. | Local |
| 1.0.0 | 2026-10-06 | Initial Estonian and English subtitle overlay. | Local |

## Review Notes

### Known Issues / Limitations

The extension relies on Jupiter’s current player structure. Shows without selectable Estonian captions, cross-origin embedded players, casting, and video-only picture-in-picture are unsupported. Seeking beyond prepared captions may briefly wait for translation. Public translation service availability is not guaranteed.

### Rejection History

No store submission or review yet.
