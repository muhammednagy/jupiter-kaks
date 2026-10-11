# Privacy Policy for Jupiter Kaks

Last updated: October 11, 2026

Jupiter Kaks is an independent Chrome extension maintained by Nagy Salem. It shows Jupiter’s and Lasteekraan’s existing Estonian captions alongside English translations. It is not affiliated with ERR or the University of Tartu.

## Information the extension handles

The extension reads Estonian subtitle text and subtitle segment metadata from the current player on jupiter.err.ee or lasteekraan.err.ee. When English translations are enabled, it sends caption text to the University of Tartu’s Neurotõlge translation service. This includes upcoming captions translated ahead of playback, even while the video is paused.

The extension stores your English on/off preference, subtitle font size and vertical position, completed translations, and translation retry timing on your device. It can retain up to 1,500 translations. It does not use Chrome’s synchronized storage.

New installations start with English translations off. The popup explains the sharing before you enable the English toggle. Updates retain previously saved preferences.

## Purpose and sharing

Caption text is used to produce English translations and display both languages. Subtitle metadata is used locally to load captions and prepare translations at the correct playback position.

Requests go over HTTPS to `https://api.tartunlp.ai/translation/v2`, with Estonian as the source language and English as the target. Requests include caption text, these language settings, and a fixed application name, “Jupiter Dual Subtitles”. The application name does not identify individual users. The service receives ordinary connection information such as your IP address. Requests omit credentials and account cookies.

Neurotõlge is a third-party service with its own data handling and retention practices. Please see [TartuNLP’s data protection policy](https://www.tartunlp.ai/andmekaitsetingimused). The maintainer does not control that service’s retention or logs.

The extension does not send video, audio, login information, account cookies, browsing history, or a unique user identifier to the maintainer or translation service. It does not contain advertising or analytics, sell data, or use caption data for advertising, creditworthiness, or lending decisions. The maintainer does not operate a server that receives captions.

## Storage, retention, and controls

Saved preferences and translations remain locally until overwritten, evicted by the cache limit, cleared, or removed with the extension. Click **Clear translations** in the popup to remove saved translations. Open Jupiter or Lasteekraan tabs may retain temporary translations in memory; refresh those tabs to remove that temporary copy.

Turn off **English translations** in the popup to stop new translation requests. Requests already in progress may finish, and data already sent to Neurotõlge remains subject to its policy. Uninstalling the extension removes its Chrome extension storage. The maintainer cannot delete data held by the third-party translation provider.

## Changes and contact

This policy will be updated when the extension’s data practices change, with the updated date shown above. Material changes will also be described in the extension’s project documentation.

For privacy questions, contact **me@muhnagy.com** or use the [project support page](https://github.com/muhammednagy/jupiter-kaks/issues). Avoid posting private information in public GitHub issues.
