# Chrome Web Store Listing — Jupiter Kaks

> Last Updated: 2026-10-06
> Package 1.3.0 uploaded as a draft. This extension has not been submitted for review yet.
> Store item ID: `nedjmeflmanahemabecplmjbdjcmopoj`

## Store Listing

**Extension Name:** Jupiter Kaks

**Short Description:** Watch Jupiter with Estonian captions and free English translations together.

**Detailed Description:**

Watch shows on Jupiter with Estonian subtitles and English translations at the same time.

Estonian appears in white and English underneath in yellow. Translations are prepared ahead, including while paused. See preparation progress, adjust subtitle size and position, and watch in fullscreen. Completed translations are saved on your device.

Open a show on jupiter.err.ee and enable its Estonian captions. Allow a few seconds for English to prepare before playing. Shows must already have selectable Estonian captions.

Caption text is sent to the University of Tartu’s Neurotõlge service for translation. No personal API key is required. Machine translations can make mistakes, and the public service may have temporary limits.

Jupiter Kaks is an independent project, unaffiliated with ERR or the University of Tartu.

**Category:** Education

**Single Purpose:** Show Jupiter’s existing Estonian captions alongside English translations.

**Primary Language:** English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|------------|--------|----------|
| Store icon | 128×128 PNG | Ready, uploaded | icons/icon-128.png |
| Small promotional tile | 440×280 RGB PNG | Ready, uploaded | store-assets/promo-440x280.png |
| Bilingual playback screenshot | 1280×800 or 640×400 | Capture pending | — |
| Popup screenshot | 1280×800 or 640×400 | Not created | — |

### Screenshot Notes

Capture both subtitle languages during playback and the popup’s preparation progress. Icons and promotional artwork are original geometric designs. The manifest includes icons at 16, 32, 48, and 128 pixels.

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

**Privacy Policy URL:** https://github.com/muhammednagy/jupiter-kaks/blob/main/PRIVACY.md

Fresh installs start with English off. The popup explains that enabling English sends upcoming caption text to Neurotõlge before the user enables it. Previously saved preferences survive updates.

## Distribution

**Store visibility:** Public.

**Regions:** Undecided.

## Developer Info

**Publisher Name:** Nagy Salem.

**Contact Email:** me@muhnagy.com (the active publisher account).

**Support URL:** https://github.com/muhammednagy/jupiter-kaks/issues

**Homepage URL:** https://github.com/muhammednagy/jupiter-kaks

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.3.0 | 2026-10-06 | Add original icons, caption-sharing disclosure, English off for new installs, public privacy policy, and clean packaging script. | Uploaded draft |
| 1.2.1 | 2026-10-06 | Rename to Jupiter Kaks; prepare project documentation for GitHub. | Local draft |
| 1.2.0 | 2026-10-06 | Use Neurotõlge batch translation with persistent cooldowns. | Local |
| 1.1.0 | 2026-10-06 | Prepare English captions ahead of playback, including while paused. | Local |
| 1.0.0 | 2026-10-06 | Initial Estonian and English subtitle overlay. | Local |

## Review Notes

### Known Issues / Limitations

The extension relies on Jupiter’s current player structure. Shows without selectable Estonian captions, cross-origin embedded players, casting, and video-only picture-in-picture are unsupported. Seeking beyond prepared captions may briefly wait for translation. Public translation service availability is not guaranteed.

### Rejection History

No store submission or review yet.

## Reviewer Test Instructions

No login or API key is required. Open https://jupiter.err.ee/1038319/esimene-stuudio or https://jupiter.err.ee/1038278/aktuaalne-kaamera. Select the Estonian subtitle track in the player (sometimes labeled Vaegkuuljad). Open Jupiter Kaks from the Chrome toolbar, read the caption-sharing notice, and enable English translations. Leave the player paused for a few seconds; the popup should show captions translated ahead. Play the show to see Estonian in white and English in yellow. Check seeking, fullscreen, subtitle size/position, and switching English off to restore the original captions. If a broadcast is unavailable in your region, use another publicly accessible Jupiter episode with selectable Estonian captions.

## Package

Run `python3 scripts/package-extension.py` to produce `jupiter-kaks-v1.3.0.zip`. The archive contains only the 12 runtime files, including icons; development files, screenshots, privacy documents, and Git metadata are excluded. `npm test` passes 11 offline tests and `npm run check` passes. Live validation confirmed 547 / 547 captions prepared on Aktuaalne kaamera and bilingual playback with the release popup disclosure.
