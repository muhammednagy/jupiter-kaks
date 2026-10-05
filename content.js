(() => {
  const { normalize, settings: sanitize, parseVtt } = JupiterShared;
  let settings = sanitize();
  let enabledReady = false;
  const controllers = new Map();
  let stopped = false;
  const style = document.createElement("style");
  style.textContent = `
    .jupiter-dual-original-hidden { opacity: 0 !important; }
    video.jupiter-dual-native-hidden::cue { color: transparent !important; background: transparent !important; text-shadow: none !important; }
    .jupiter-dual-overlay { position: absolute !important; left: 4% !important; right: 4% !important;
      z-index: 25 !important; pointer-events: none !important; text-align: center !important;
      font-family: Arial, sans-serif !important; line-height: 1.3 !important; text-shadow: 0 1px 3px #000 !important; }
    .jupiter-dual-overlay[hidden] { display: none !important; }
    .jupiter-dual-line { width: fit-content !important; max-width: 100% !important; margin: 3px auto !important;
      padding: 3px 9px !important; border-radius: 4px !important; background: rgba(0,0,0,.82) !important;
      white-space: pre-line !important; overflow-wrap: anywhere !important; font-weight: 500 !important; }
    .jupiter-dual-et { color: #fff !important; }
    .jupiter-dual-en { color: #ffe289 !important; }
    .jupiter-dual-pending { color: #ddd !important; font-size: .7em !important; }
  `;
  document.documentElement.append(style);

  function message(value) { return chrome.runtime.sendMessage(value); }
  class Captions {
    constructor(video) {
      this.video = video;
      this.player = video.closest(".shaka-video-container, [data-shaka-player-container], .video-js, .plyr") || video.parentElement;
      this.originals = [];
      this.text = "";
      this.translations = new Map();
      this.requests = new Map();
      this.failures = new Map();
      this.cues = [];
      this.segmentKey = "";
      this.segments = [];
      this.loadedSegments = new Set();
      this.loadingSegments = new Set();
      this.cueKeys = new Set();
      this.preparing = false;
      this.prefetchRetryAt = 0;
      this.prefetchError = "";
      this.source = video.currentSrc;
      this.path = location.href;
      this.error = "";
      this.lastPrefetch = 0;
      this.overlay = document.createElement("div");
      this.overlay.className = "jupiter-dual-overlay";
      this.overlay.setAttribute("role", "group");
      this.overlay.setAttribute("aria-label", "Estonian and English subtitles");
      this.overlay.hidden = true;
      this.et = document.createElement("div");
      this.et.className = "jupiter-dual-line jupiter-dual-et";
      this.et.lang = "et";
      this.en = document.createElement("div");
      this.en.className = "jupiter-dual-line jupiter-dual-en";
      this.en.lang = "en";
      this.overlay.append(this.et, this.en);
      this.player.append(this.overlay);
      this.seek = () => { this.text = ""; this.overlay.hidden = true; this.restore(); this.lastPrefetch = 0; };
      video.addEventListener("seeking", this.seek);
      this.tick();
    }
    restore() {
      for (const element of this.originals) element.classList.remove("jupiter-dual-original-hidden");
      this.video.classList.remove("jupiter-dual-native-hidden");
    }
    destroy() { this.segmentKey = ""; this.restore(); this.overlay.remove(); this.video.removeEventListener("seeking", this.seek); }
    resetTimeline() {
      this.segmentKey = ""; this.segments = []; this.cues = []; this.cueKeys.clear();
      this.loadedSegments.clear(); this.loadingSegments.clear(); this.prefetchError = "";
    }
    setSegments(data) {
      const key = `${data.source}|${data.trackId}`;
      if (key === this.segmentKey) return;
      this.resetTimeline();
      this.source = this.video.currentSrc;
      this.path = location.href;
      this.segmentKey = key;
      this.segments = data.segments;
      this.loadAhead();
    }
    loadAhead() {
      if (!settings.enabled || !enabledReady) return;
      const now = this.video.currentTime;
      const sorted = [...this.segments].sort((a, b) => {
        const score = segment => segment.end >= now ? Math.max(0, segment.start - now) : 1e6 + segment.start;
        return score(a) - score(b);
      });
      for (const segment of sorted) {
        if (this.loadingSegments.size >= 2) break;
        if (this.loadedSegments.has(segment.url) || this.loadingSegments.has(segment.url)) continue;
        this.loadingSegments.add(segment.url);
        const key = this.segmentKey;
        void (async () => {
          try {
            const response = await fetch(segment.url, { credentials: "omit", signal: AbortSignal.timeout(10000) });
            if (!response.ok) throw new Error("Subtitle download failed.");
            const text = await response.text();
            if (key !== this.segmentKey) return;
            if (text.length > 500000) return;
            for (const cue of parseVtt(text, segment.offset, segment.start)) {
              const id = `${cue.start}|${cue.end}|${normalize(cue.text)}`;
              if (!this.cueKeys.has(id)) { this.cueKeys.add(id); this.cues.push(cue); }
            }
            this.cues.sort((a, b) => a.start - b.start);
          } catch {
            if (key === this.segmentKey) this.prefetchError = "Some subtitle segments could not be loaded ahead.";
          } finally {
            if (key === this.segmentKey) {
              this.loadingSegments.delete(segment.url);
              this.loadedSegments.add(segment.url);
              this.loadAhead();
              void this.prepare();
            }
          }
        })();
      }
    }
    async prepare() {
      if (this.preparing || !enabledReady || !settings.enabled || Date.now() < this.prefetchRetryAt || stopped) return;
      const now = this.video.currentTime;
      const ordered = [...this.cues].sort((a, b) => {
        const score = cue => cue.end >= now ? Math.max(0, cue.start - now) : 1e6 + cue.start;
        return score(a) - score(b);
      });
      const texts = [...new Set(ordered.map(cue => normalize(cue.text)))].filter(text =>
        text && !this.translations.has(text) && !this.requests.has(text) && !(this.failures.get(text) > Date.now())).slice(0, 12);
      if (!texts.length) return;
      this.preparing = true;
      for (const text of texts) this.requests.set(text, { priority: false });
      try {
        const reply = await message({ type: "translate:batch", texts });
        for (let i = 0; i < texts.length; i++) {
          const result = reply?.results?.[i];
          if (result?.text) this.translations.set(texts[i], result.text);
          else {
            this.prefetchRetryAt = Date.now() + (result?.retryAfter || 15000);
            this.failures.set(texts[i], this.prefetchRetryAt);
            this.prefetchError = result?.error || "Advance translation is temporarily unavailable.";
          }
        }
        if (reply?.results?.every(result => result.text)) this.prefetchError = "";
      } catch { this.prefetchRetryAt = Date.now() + 15000; }
      finally { for (const text of texts) this.requests.delete(text); this.preparing = false; }
      this.render();
    }
    read() {
      this.originals = [...this.player.querySelectorAll(".shaka-text-container, .vjs-text-track-display, .plyr__captions")];
      const rendered = this.originals.filter(element => {
        const css = getComputedStyle(element);
        return css.display !== "none" && css.visibility !== "hidden";
      }).map(element => element.textContent.trim()).filter(Boolean);
      if (rendered.length) return rendered.join("\n");
      return [...this.video.textTracks].filter(track => track.mode === "showing" && /^(et|est)(-|$)/i.test(track.language))
        .flatMap(track => Array.from(track.activeCues || [], cue => {
          // Cue markup is text, never HTML in the overlay.
          const template = document.createElement("template");
          template.innerHTML = cue.text;
          return template.content.textContent;
        })).join("\n");
    }
    async request(text, priority) {
      const key = normalize(text);
      if (!key || key.length > 1500 || this.translations.has(key)) return;
      if (this.requests.has(key)) {
        const pending = this.requests.get(key);
        if (priority && !pending.priority) {
          pending.priority = true;
          void message({ type: "translate", text: key, priority: true }).catch(() => {});
        }
        return;
      }
      if ((this.failures.get(key) || 0) > Date.now()) return;
      const task = (async () => {
        try {
          const reply = await message({ type: "translate", text: key, priority });
          if (reply?.text) {
            this.translations.set(key, reply.text);
            while (this.translations.size > 1500) this.translations.delete(this.translations.keys().next().value);
            this.failures.delete(key);
            if (normalize(this.text) === key) this.error = "";
          } else {
            this.failures.set(key, Date.now() + (reply?.retryAfter || 15000));
            if (normalize(this.text) === key) this.error = reply?.error || "Translation unavailable. Try again later.";
          }
        } catch {
          stopped = true;
          for (const controller of controllers.values()) { controller.restore(); controller.overlay.hidden = true; }
        } finally { this.requests.delete(key); }
        if (!stopped && this.video.isConnected) this.render();
      })();
      this.requests.set(key, { task, priority });
      await task;
    }
    render() {
      const visible = enabledReady && settings.enabled && !!this.text && !this.video.seeking && !stopped;
      this.overlay.hidden = !visible;
      this.overlay.style.bottom = `${settings.bottom}%`;
      this.overlay.style.fontSize = `${settings.fontSize}px`;
      if (!visible) { this.restore(); return; }
      for (const element of this.originals) element.classList.add("jupiter-dual-original-hidden");
      if (!this.originals.length) this.video.classList.add("jupiter-dual-native-hidden");
      this.et.textContent = this.text;
      const translated = this.translations.get(normalize(this.text));
      this.en.textContent = translated || this.error || "Translating…";
      this.en.classList.toggle("jupiter-dual-pending", !translated);
    }
    tick() {
      if (this.source !== this.video.currentSrc || this.path !== location.href) {
        this.resetTimeline();
        this.source = this.video.currentSrc;
        this.path = location.href;
        this.text = "";
      }
      const text = this.video.seeking ? "" : this.read();
      if (text !== this.text) { this.text = text; this.error = ""; }
      if (enabledReady && settings.enabled && text) void this.request(text, true);
      this.render();
      if (enabledReady && settings.enabled && Date.now() - this.lastPrefetch > 500) {
        this.lastPrefetch = Date.now();
        this.loadAhead();
        void this.prepare();
      }
    }
  }
  window.addEventListener("message", event => {
    if (event.source !== window || event.origin !== location.origin || event.data?.channel !== "jupiter-dual-segments-v1") return;
    const data = event.data;
    if (!Array.isArray(data.segments) || data.segments.length > 1500) return;
    if (data.language && !/^(et|est|und)(-|$)/i.test(data.language)) return;
    const segments = data.segments.filter(segment => {
      try {
        const url = new URL(segment.url);
        return url.protocol === "https:" && (url.hostname === "err.ee" || url.hostname.endsWith(".err.ee")) && /\.vtt$/i.test(url.pathname) &&
          Number.isFinite(segment.start) && Number.isFinite(segment.end) && Number.isFinite(segment.offset);
      } catch { return false; }
    });
    for (const [video, controller] of controllers) {
      if (video.id !== data.videoId || video.currentSrc !== data.source) continue;
      controller.setSegments({ ...data, segments });
    }
  });
  chrome.runtime.onMessage.addListener((value, sender, respond) => {
    if (value.type === "settings:changed") {
      settings = sanitize(value.settings);
      for (const controller of controllers.values()) { controller.failures.clear(); controller.tick(); }
    } else if (value.type === "status:get") {
      respond({ players: controllers.size, active: [...controllers.values()].some(controller => !!controller.text),
        error: [...controllers.values()].find(controller => controller.error)?.error ||
          [...controllers.values()].find(controller => controller.prefetchError)?.prefetchError || "",
        prepared: [...controllers.values()].reduce((sum, controller) => sum + controller.cues.filter(cue => controller.translations.has(normalize(cue.text))).length, 0),
        total: [...controllers.values()].reduce((sum, controller) => sum + controller.cues.length, 0),
        loading: [...controllers.values()].some(controller => controller.loadingSegments.size > 0) });
    }
  });
  function scan() {
    if (stopped) return;
    for (const [video, controller] of controllers) {
      if (!video.isConnected || !controller.player.isConnected || !controller.player.contains(video)) {
        controller.destroy(); controllers.delete(video);
      }
    }
    for (const video of document.querySelectorAll("video")) {
      if (!controllers.has(video)) controllers.set(video, new Captions(video));
    }
    for (const controller of controllers.values()) controller.tick();
  }
  message({ type: "settings:get" }).then(reply => {
    if (reply?.error) throw new Error(reply.error);
    settings = sanitize(reply?.settings);
    enabledReady = true;
    scan();
  }).catch(() => { stopped = true; });
  setInterval(scan, 150);
})();
