# Contributor guidance

## Project

Jupiter Kaks is a Manifest V3 Chrome extension for `https://jupiter.err.ee/*` and
`https://lasteekraan.err.ee/*`.
It shows existing Estonian captions in white with English translations underneath
in yellow. English must be prepared ahead of playback, including while paused.
Translation uses the University of Tartu's free Neurotõlge service without a
personal API key. The project is independent of ERR and the University of Tartu.

Keep the extension small: plain JavaScript, HTML, and CSS, with no build step or
runtime dependencies. Follow the style of the file being edited. Avoid unrelated
refactors when fixing a focused issue.

## File map

- `manifest.json`: extension metadata, permissions, and script registration.
- `page-bridge.js`: MAIN-world script that reads Shaka's subtitle segment index
  and sends segment metadata to the isolated content script.
- `content.js`: downloads subtitle segments, prepares translations, manages
  playback and seeking, and renders the bilingual overlay inside the player.
- `background.js`: validates messages, calls Neurotõlge, queues and deduplicates
  requests, persists translations, and handles retry cooldowns.
- `shared.js`: settings validation, caption normalization, VTT parsing, and
  translation-response validation. Exposes `JupiterShared` without a bundler.
- `popup.html`, `popup.css`, `popup.js`: preparation progress and display controls.
- `tests/extension.test.cjs`: Node tests with mocked Chrome APIs and player state.
- `README.md`: installation, behavior, limitations, and privacy documentation.
- `CHROMEWEBSTORE.md`: store metadata and release status; version 1.3.0 is published.
- `publish-github.sh`: initial repository creation helper, not a release command.

## Behavior to preserve

- Load available subtitle segments and translate upcoming cues before they appear.
  Preparation must continue while paused and prioritize the current playback
  position after seeking. Fall back to displayed-caption translation when the
  subtitle timeline cannot be read.
- Deduplicate captions spanning multiple segments and repeated translation
  requests. Preserve the mapping between each source caption and its translation;
  reject incomplete or invalid translation batches.
- Keep requests serialized and bounded. Respect service cooldowns rather than
  repeatedly retrying failures. Cache completed translations and persist throttle
  timestamps so service-worker restarts do not reset them.
- Never let a late response replace the English text for a newer Estonian caption.
  Reset timeline state when the video source or episode changes.
- Keep the overlay inside the player for fullscreen support. Seeking, disabling
  English, player removal, and extension invalidation must restore native captions.
- Preserve Estonian captions when translation is unavailable. Surface useful
  preparation progress and errors in the popup.

## Extension boundaries and privacy

- Keep Manifest V3 and compatibility with the manifest's minimum Chrome version.
  Do not add framework tooling or new permissions without a feature requiring them.
- Keep scripts scoped to Jupiter and Lasteekraan and translation network access scoped to
  `https://api.tartunlp.ai/*`. Subtitle segment URLs must remain restricted to HTTPS
  ERR domains and validated before fetching.
- The page-world bridge reads player state; it must not modify playback or
  monkey-patch Shaka. Guard internal manifest access because its shape may change.
  Do not assume `getTextDisplayer()` exists on Jupiter's deployed player.
- Validate runtime message senders and page-message origin, source, and payload.
  Settings writes and cache clearing belong to the extension popup.
- Display captions and translations as text, never executable HTML. Do not add
  inline scripts, inline event handlers, remote executable code, or `eval()`.
- Send only caption text and the fixed application identifier to Neurotõlge.
  Omit request credentials. Do not transmit video, audio, account cookies, browsing
  history, or user identifiers. Keep preferences and translations on the device.
- Retain the existing `Jupiter Dual Subtitles` application identifier for provider
  consistency unless intentionally migrating it. The user-facing name is
  `Jupiter Kaks`.

## Validation and documentation

Use Node 22 or newer; no dependency installation is required.

```sh
npm test
npm run check
```

Run both commands for JavaScript or manifest changes. Add regression tests for
meaningful behavior changes, especially advance preparation while paused, seek
ordering, stale responses, deduplication, and cooldown persistence. Keep automated
tests offline with mocked service responses so they do not consume public quotas.
For documentation-only changes, review the content and run `git diff --check`.

For player, caption, or popup behavior changes, reload the unpacked extension at
`chrome://extensions`, refresh Jupiter or Lasteekraan, and verify preparation while paused,
playback, seeking, fullscreen, and the English toggle as relevant. Do not claim
browser validation unless it was actually performed.

Update `README.md` when installation, behavior, limitations, or privacy changes.
Update `CHROMEWEBSTORE.md` for user-facing, permission, or privacy changes. When
bumping a release version, keep `manifest.json` and `package.json` in sync.
Documentation-only changes do not require an extension version bump.

## Git and GitHub

Repository: `https://github.com/muhammednagy/jupiter-kaks`; default branch: `main`.
Use `gh` for GitHub operations and the checkout's configured remote for Git pushes.
The maintainer's current checkout uses
`personal:muhammednagy/jupiter-kaks.git` to select the personal SSH identity; do not
silently replace it with the work account's default SSH connection.

Inspect the worktree before editing or committing and preserve existing changes.
Use focused commits. Do not force-push or rewrite existing history unless requested.
Use the maintainer's GitHub no-reply address for new commits in this checkout.
Never commit credentials, private keys, local translation caches, or generated
archives. Repository publication is separate from Chrome Web Store submission.
