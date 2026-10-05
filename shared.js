/* Shared by the popup, content script, and service worker. No build step. */
(() => {
  const defaults = Object.freeze({ enabled: false, fontSize: 24, bottom: 12 });
  function normalize(text) {
    return String(text ?? "").replace(/\s+/gu, " ").trim();
  }
  function settings(value = {}) {
    return {
      enabled: typeof value.enabled === "boolean" ? value.enabled : defaults.enabled,
      fontSize: Math.max(14, Math.min(44, Number(value.fontSize) || defaults.fontSize)),
      bottom: Math.max(5, Math.min(40, Number(value.bottom) || defaults.bottom))
    };
  }
  function translationTexts(data, count) {
    if (!Array.isArray(data?.result) || data.result.length !== count ||
        data.result.some(text => typeof text !== "string" || !text.trim())) {
      throw new Error("Neurotõlge returned an unexpected translation batch. Try again later.");
    }
    return data.result.map(text => text.trim());
  }
  function timestamp(value) {
    const parts = value.split(":").map(Number);
    if (parts.some(part => !Number.isFinite(part)) || parts.length < 2 || parts.length > 3) return NaN;
    return parts.reduce((sum, part) => sum * 60 + part, 0);
  }
  function parseVtt(source, offset = 0, referenceStart = 0) {
    source = String(source).replace(/^\uFEFF/, "").replace(/\r/g, "");
    if (!source.startsWith("WEBVTT")) return [];
    const map = source.match(/X-TIMESTAMP-MAP[^\n]*LOCAL:([\d:.]+)[^\n]*MPEGTS:(\d+)/);
    if (map) {
      const wrap = 2 ** 33 / 90000;
      offset += Number(map[2]) / 90000 - timestamp(map[1]);
      offset += Math.round((referenceStart - offset) / wrap) * wrap;
    }
    const cues = [];
    for (const block of source.split(/\n\s*\n/)) {
      if (/^(NOTE|STYLE|REGION)(\s|$)/.test(block)) continue;
      const lines = block.split("\n");
      const i = lines.findIndex(line => line.includes("-->"));
      if (i < 0) continue;
      const match = lines[i].match(/([\d:.]+)\s+-->\s+([\d:.]+)/);
      if (!match) continue;
      const start = timestamp(match[1]) + offset;
      const end = timestamp(match[2]) + offset;
      const text = lines.slice(i + 1).join("\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")
        .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, value) => {
          if (value[0] !== "#") return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " })[value.toLowerCase()] || entity;
          const code = value[1].toLowerCase() === "x" ? parseInt(value.slice(2), 16) : Number(value.slice(1));
          return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
        }).trim();
      if (Number.isFinite(start) && Number.isFinite(end) && end > start && text && text.length <= 1500) cues.push({ start, end, text });
    }
    return cues;
  }
  globalThis.JupiterShared = Object.freeze({ defaults, normalize, settings, translationTexts, parseVtt });
})();
