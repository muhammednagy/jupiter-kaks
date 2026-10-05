# Jupiter Kaks

**Two languages. One show.** “Kaks” means “two” in Estonian.

A Chrome extension that shows Jupiter's Estonian subtitles with English translations underneath. Free, no account, no API key, no build tools required. This is an independent project, unaffiliated with ERR or the University of Tartu.

## Install

1. Download and unzip this repository, or clone it with Git.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** at the top right.
4. Click **Load unpacked** and select the downloaded folder containing `manifest.json`.
5. Refresh any already-open Jupiter page.
6. Open a show and turn on **Estonian subtitles** using Jupiter's subtitle button. Some shows label this track **Vaegkuuljad** (captions for hearing-impaired viewers).

Give the extension a few seconds to prepare English before starting playback. Preparation continues while paused; the popup shows how many captions are ready.

The overlay displays Estonian in white and English in yellow. Both stay inside the player in fullscreen. The extension icon opens controls for enabling English, changing font size, moving subtitles vertically, and clearing saved translations.

## How it works

- Jupiter currently uses Shaka Player and renders captions in `.shaka-text-container`. The extension reads the selected captions and replaces their visible presentation with a two-language overlay.
- A small page-world bridge reads Shaka's selected subtitle segment index. The extension downloads available VTT segments, deduplicates captions spanning multiple segments, and translates them ahead in batches of up to 12. Preparation continues while paused, starting at the current position and then working through the episode. After seeking, the next batch prioritizes the new playback position.
- Translation uses the University of Tartu's [Neurotõlge public API](https://api.tartunlp.ai/translation/docs), with Estonian (`et`) as the source and English (`en`) as the target. The API accepts arrays of captions and returns translations in matching order. Invalid or incomplete batches are rejected to avoid mixing up captions.
- Requests run in the extension's service worker, with network permission only for `https://api.tartunlp.ai/`. One batch runs at a time, with at least 1.5 seconds between request starts. No personal API key is required.
- Up to 1,500 translations are cached on this device to reduce repeated requests. Late responses never replace a different caption. Turning the extension off restores Jupiter's captions.

## Limits and privacy

The free public translation service can be unavailable or throttle requests. HTTP 429/503 triggers an increasing cooldown, saved across worker restarts, and preparation resumes automatically. If English is unavailable, the Estonian caption remains visible with a short error. Give preparation a few seconds before starting; seeking beyond prepared captions can temporarily show “Translating…”. Shaka's internal manifest structure can change. If advance loading is unavailable, the extension falls back to translating the displayed caption.

Caption text, including captions not yet watched, is sent to TartuNLP's Neurotõlge service. See their [data protection policy](https://www.tartunlp.ai/andmekaitsetingimused). Video/audio, cookies, account details, and browsing history are not sent by this extension. It runs only on `https://jupiter.err.ee/*` and stores settings and translations locally. Clearing the cache removes saved translations; currently open player tabs retain their temporary in-memory translations until refreshed.

Select an Estonian caption track: the translator always assumes Estonian input. Shows without selectable captions, burned-in subtitles, cross-origin embedded players, casting, and video-only picture-in-picture are not supported. This extension does not generate subtitles from audio or change content availability. Machine translations may contain errors.

## Development

There are no npm dependencies. With Node 22+ installed:

```sh
npm test
npm run check
```

After editing content scripts or the service worker, reload the extension at `chrome://extensions`, then refresh Jupiter.

Chrome's [extension installation guide](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load_an_unpacked_extension) explains loading an unpacked extension. The [content scripts documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) describes the isolated and main execution worlds; [network request documentation](https://developer.chrome.com/docs/extensions/develop/concepts/network-requests) explains why translation runs in the service worker.
