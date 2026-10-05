/* Page world: expose Shaka's selected subtitle segment index without changing playback. */
(() => {
  if (window.__jupiterDualBridge) return;
  window.__jupiterDualBridge = true;
  const states = new WeakMap();
  function allowed(url) {
    try {
      const value = new URL(url);
      return value.protocol === 'https:' && (value.hostname === 'err.ee' || value.hostname.endsWith('.err.ee')) && /\.vtt$/i.test(value.pathname);
    } catch { return false; }
  }
  async function inspect(video) {
    try {
      const player = video.ui?.getControls?.().getPlayer?.();
      if (!player?.getManifest) return;
      const tracks = player.getTextTracks?.() || [];
      const selected = tracks.find(track => track.active) || tracks.find(track => /^(et|est|und)(-|$)/i.test(track.language));
      if (!selected || !/^(et|est|und)(-|$)/i.test(selected.language)) return;
      const key = `${video.currentSrc}|${selected.id}`;
      let state = states.get(video);
      if (state?.key === key && state.segments) {
        // Repeat delivery so document_idle injection cannot miss the first message.
        if (Date.now() - state.sent < 2000) return;
        state.sent = Date.now();
        window.postMessage({ channel: 'jupiter-dual-segments-v1', videoId: video.id, source: video.currentSrc,
          language: selected.language, trackId: selected.id, segments: state.segments }, location.origin);
        return;
      }
      if (state?.key === key && state.loading) return;
      state = { key, loading: true, sent: 0 };
      states.set(video, state);
      // getManifest's structure can change with Shaka versions; all access is guarded.
      const stream = player.getManifest()?.textStreams?.find(stream => stream.id === selected.id);
      if (!stream) { state.loading = false; return; }
      if (!stream.segmentIndex) await stream.createSegmentIndex?.();
      if (states.get(video) !== state || `${video.currentSrc}|${selected.id}` !== key) return;
      const segments = [];
      for (const ref of stream.segmentIndex || []) {
        const url = ref.getUris?.().find(allowed);
        if (url && Number.isFinite(ref.startTime) && Number.isFinite(ref.endTime)) {
          segments.push({ url, start: ref.startTime, end: ref.endTime, offset: ref.timestampOffset || 0 });
        }
        if (segments.length >= 1500) break;
      }
      state.segments = segments.length ? segments : null;
      state.loading = false;
      if (state.segments) {
        state.sent = Date.now();
        window.postMessage({ channel: 'jupiter-dual-segments-v1', videoId: video.id, source: video.currentSrc,
          language: selected.language, trackId: selected.id, segments }, location.origin);
      }
    } catch { const state = states.get(video); if (state) state.loading = false; }
  }
  setInterval(() => { for (const video of document.querySelectorAll('video')) void inspect(video); }, 500);
})();
