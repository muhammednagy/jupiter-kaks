# Chrome Web Store Listing — Jupiter Kaks

> Last Updated: 2026-10-11
> Version 1.3.0 is published publicly. Publisher contact email is verified. Status confirmed in the developer dashboard on 2026-10-11.
> Store item ID: `nedjmeflmanahemabecplmjbdjcmopoj`

> Version 1.4.0 adds Lasteekraan support and is packaged for the store update. The published 1.3.0 copy supports Jupiter only.

## Store Listing

**Extension Name:** Jupiter Kaks

**Short Description:** Watch Jupiter and Lasteekraan with Estonian captions and free English translations together.

**Detailed Description:**

Watch Jupiter and Lasteekraan shows with Estonian subtitles and English translations at the same time.

Estonian appears in white and English underneath in yellow. English captions are prepared ahead, including while paused. The popup shows preparation progress and lets you adjust subtitle size and position. Both languages remain visible in fullscreen, and completed translations are saved on your device.

HOW TO USE
1. Open a show on jupiter.err.ee or lasteekraan.err.ee and enable its Estonian captions. Some shows call this track Vaegkuuljad.
2. Click Jupiter Kaks in Chrome’s toolbar, read the caption-sharing notice, and enable English translations.
3. Allow a few seconds for captions to prepare, then press Play.

FREE TRANSLATION
No account or personal API key is required. Caption text, including upcoming captions, is sent to the University of Tartu’s Neurotõlge service when English is enabled. New installations start with English off. The public service may have temporary limits, and machine translations can make mistakes.

Works with shows that already have selectable Estonian captions. It does not create captions from audio. Casting, video-only picture-in-picture, and cross-origin embedded players are not supported.

Jupiter Kaks is an independent project, unaffiliated with ERR or the University of Tartu.

Support: https://github.com/muhammednagy/jupiter-kaks/issues

**Category:** Education

**Single Purpose:** Show Jupiter’s and Lasteekraan’s existing Estonian captions alongside English translations, prepared ahead of playback.

**Primary Language:** English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|------------|--------|----------|
| Store icon | 128×128 PNG | Ready, uploaded | icons/icon-128.png |
| Small promotional tile | 440×280 RGB PNG | Ready, uploaded | store-assets/promo-440x280.png |
| Bilingual playback screenshot | 1280×800 RGB PNG | Ready, uploaded | store-assets/screenshot-1280x800.png |

### Screenshot Notes

The screenshot captures actual bilingual captions on Esimene stuudio at 2:15, using Chrome’s responsive viewport at 1280×800 with device pixel ratio 1. Its opaque pixels are encoded as RGB PNG for the store. Icons and promotional artwork are original geometric designs. The manifest includes icons at 16, 32, 48, and 128 pixels.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| storage | permissions | Save subtitle preferences, completed translations, and retry cooldowns on this device. |
| https://api.tartunlp.ai/* | host_permissions | Send caption text to Neurotõlge and receive English translations. |
| https://jupiter.err.ee/* | content_scripts matches | Read the player’s Estonian captions and subtitle segments, and display both languages inside the player. |
| https://lasteekraan.err.ee/* | content_scripts matches | Read the player’s Estonian captions and subtitle segments, and display both languages inside the player. |

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

**Regions:** All regions.

## Developer Info

**Publisher Name:** Nagy Salem.

**Contact Email:** me@muhnagy.com (the active publisher account).

**Support URL:** https://github.com/muhammednagy/jupiter-kaks/issues

**Homepage URL:** https://github.com/muhammednagy/jupiter-kaks

## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.4.0 | 2026-10-11 | Support Lasteekraan alongside Jupiter; update site access, popup guidance, and privacy wording. | Packaged for upload |
| 1.3.0 | 2026-10-06 | Add original icons, caption-sharing disclosure, English off for new installs, public privacy policy, and clean packaging script. | Published, public |
| 1.2.1 | 2026-10-06 | Rename to Jupiter Kaks; prepare project documentation for GitHub. | Local draft |
| 1.2.0 | 2026-10-06 | Use Neurotõlge batch translation with persistent cooldowns. | Local |
| 1.1.0 | 2026-10-06 | Prepare English captions ahead of playback, including while paused. | Local |
| 1.0.0 | 2026-10-06 | Initial Estonian and English subtitle overlay. | Local |

## Review Notes

### Known Issues / Limitations

The extension relies on Jupiter’s and Lasteekraan’s current player structure. Shows without selectable Estonian captions, cross-origin embedded players, casting, and video-only picture-in-picture are unsupported. Seeking beyond prepared captions may briefly wait for translation. Public translation service availability is not guaranteed.

### Rejection History

No rejections recorded. Version 1.3.0 is published.

## Reviewer Test Instructions

No login or API key is required. Open https://jupiter.err.ee/1038319/esimene-stuudio or https://jupiter.err.ee/1038278/aktuaalne-kaamera. Select the Estonian subtitle track in the player (sometimes labeled Vaegkuuljad). Open Jupiter Kaks from the Chrome toolbar, read the caption-sharing notice, and enable English translations. Leave the player paused for a few seconds; the popup should show captions translated ahead. Play the show to see Estonian in white and English in yellow. Check seeking, fullscreen, subtitle size/position, and switching English off to restore the original captions. If a broadcast is unavailable in your region, use another publicly accessible Jupiter episode with selectable Estonian captions.

For Lasteekraan, repeat these checks at https://lasteekraan.err.ee/1610147252/veider-kamp with its Vaegkuuljad track, or another available episode with selectable Estonian captions.

## Package

Run `python3 scripts/package-extension.py` to produce `jupiter-kaks-v1.4.0.zip`. The archive contains only the 12 runtime files, including icons; development files, screenshots, privacy documents, and Git metadata are excluded. The 1.3.0 validation confirmed 11 offline tests and JavaScript syntax checks. Its live validation confirmed 547 / 547 captions prepared on Aktuaalne kaamera and bilingual playback with the release popup disclosure.

Version 1.4.0 passes 16 offline tests and `npm run check`. Live Lasteekraan validation on Veider Kamp confirmed preparation advancing from 148 to 232 captions while paused, all 300 captions prepared, bilingual playback, both languages visible in fullscreen, and English off restoring native Estonian captions. The local unpacked copy was disabled after testing so it does not run alongside the installed 1.3.0 copy.
