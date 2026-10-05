const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");
const tick = () => new Promise(resolve => setImmediate(resolve));

test("translation arrays require one nonempty result per caption", () => {
  const context = vm.createContext({});
  vm.runInContext(source("shared.js"), context);
  const shared = context.JupiterShared;
  assert.equal(shared.translationTexts({ result: ["Good evening.", " Welcome! "] }, 2).join("|"), "Good evening.|Welcome!");
  assert.throws(() => shared.translationTexts({ error: "quota" }, 2), /unexpected/);
  assert.throws(() => shared.translationTexts({ result: ["Hello."] }, 2), /unexpected/);
  assert.throws(() => shared.translationTexts({ result: [""] }, 1), /unexpected/);
  assert.equal(shared.normalize("  Tere\n õhtust. "), "Tere õhtust.");
});

function worker(fetch, data = {}) {
  let listener;
  let context;
  const chrome = {
    runtime: { id: "test", getURL: name => `chrome-extension://test/${name}`, onMessage: { addListener: fn => { listener = fn; } } },
    storage: { local: {
      setAccessLevel: async () => {},
      get: async key => ({ [key]: data[key] }),
      set: async value => { Object.assign(data, value); }
    } },
    tabs: { query: async () => [], sendMessage: async () => {} }
  };
  context = vm.createContext({ chrome, fetch, URL, URLSearchParams, AbortSignal, setTimeout: fn => setImmediate(fn), console });
  context.importScripts = name => vm.runInContext(source(name), context);
  vm.runInContext(source("background.js"), context);
  const sender = { id: "test", url: "https://jupiter.err.ee/1038319/esimene-stuudio" };
  return {
    data,
    send(message, who = sender) { return new Promise(resolve => { if (listener(message, who, resolve) !== true) resolve(undefined); }); },
    popup: { id: "test", url: "chrome-extension://test/popup.html" }
  };
}

test("service worker deduplicates requests and persists translations across repeat captions", async () => {
  let calls = 0;
  const w = worker(async (url, options) => {
    calls++;
    assert.equal(url, "https://api.tartunlp.ai/translation/v2");
    const body = JSON.parse(options.body);
    assert.equal(body.src, "et");
    assert.equal(body.tgt, "en");
    assert.equal(body.text[0], "Tere õhtust.");
    assert.equal(options.method, "POST");
    assert.equal(options.credentials, "omit");
    return { ok: true, status: 200, json: async () => ({ result: ["Good evening."] }) };
  });
  const replies = await Promise.all([
    w.send({ type: "translate", text: "Tere\nõhtust." }),
    w.send({ type: "translate", text: "Tere õhtust.", priority: true })
  ]);
  assert.equal(replies[0].text, "Good evening.");
  assert.equal(replies[1].text, "Good evening.");
  assert.equal(calls, 1);
  assert.equal((await w.send({ type: "translate", text: "Tere õhtust." })).cached, true);
  await tick();
  assert.equal(w.data["translations-tartunlp-v1"].length, 1);
  await w.send({ type: "cache:clear" }, w.popup);
  assert.equal(w.data["translations-tartunlp-v1"].length, 0);
});

test("rate limiting enters a cooldown without sending more network requests", async () => {
  let calls = 0;
  const w = worker(async () => {
    calls++;
    return { ok: false, status: 429, headers: { get: () => "60" } };
  });
  const first = await w.send({ type: "translate", text: "Tere." });
  assert.match(first.error, /temporarily unavailable/);
  assert.ok(first.retryAfter > 0);
  const second = await w.send({ type: "translate", text: "Head aega." });
  assert.match(second.error, /temporarily unavailable/);
  assert.equal(calls, 1);
  const restarted = worker(async () => { calls++; throw new Error("must not retry during saved cooldown"); }, w.data);
  assert.match((await restarted.send({ type: "translate", text: "Veel üks lause." })).error, /temporarily unavailable/);
  assert.equal(calls, 1, "worker restarts must preserve the cooldown");
});

test("advance captions share one request and retain their individual translations", async () => {
  let calls = 0;
  const w = worker(async (url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body).text, ["Tere.", "Head aega.", "Aitäh."]);
    return { ok: true, status: 200, json: async () => ({ result: ["Hello.", "Goodbye.", "Thank you."] }) };
  });
  const reply = await w.send({ type: "translate:batch", texts: ["Tere.", "Head aega.", "Aitäh."] });
  assert.deepEqual(Array.from(reply.results, result => result.text), ["Hello.", "Goodbye.", "Thank you."]);
  assert.equal(calls, 1, "a batch must not start with a separate single-caption request");
  assert.equal((await w.send({ type: "translate", text: "Head aega." })).cached, true);
});

test("disabled extension and invalid senders cannot trigger translations or change settings", async () => {
  let calls = 0;
  const w = worker(async () => { calls++; throw new Error("must not fetch"); });
  assert.equal(await w.send({ type: "translate", text: "Tere" }, { id: "test", url: "https://example.com/" }), undefined);
  assert.equal(await w.send({ type: "settings:set", settings: { enabled: false } }), undefined);
  await w.send({ type: "settings:set", settings: { enabled: false } }, w.popup);
  assert.match((await w.send({ type: "translate", text: "Tere." })).error, /turned off/);
  assert.equal(calls, 0);
});

function contentHarness(fetch) {
  class Element {
    constructor() {
      this.children = []; this.style = {}; this.textContent = ""; this.isConnected = true;
      const classes = new Set();
      this.classList = { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value), toggle: (value, on) => on ? classes.add(value) : classes.delete(value) };
    }
    append(...elements) { this.children.push(...elements); }
    setAttribute() {}
    remove() { this.isConnected = false; }
    contains(element) { return element === video || this.children.includes(element); }
    querySelectorAll() { return [caption]; }
  }
  const player = new Element();
  const caption = new Element();
  const video = new Element();
  Object.assign(video, { currentSrc: "blob:episode1", currentTime: 10, paused: true, seeking: false, id: "player", textTracks: [], closest: () => player, events: {},
    addEventListener(name, fn) { this.events[name] = fn; }, removeEventListener(name) { delete this.events[name]; } });
  caption.textContent = "Tere õhtust.";
  const requests = [];
  let listener;
  let scan;
  let receive;
  const window = { addEventListener: (name, fn) => { receive = fn; } };
  const document = {
    documentElement: new Element(), createElement: () => new Element(), querySelectorAll: () => [video]
  };
  const context = vm.createContext({
    document, location: { href: "https://jupiter.err.ee/1038319/show", origin: "https://jupiter.err.ee" },
    window, fetch, URL, AbortSignal,
    getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    setInterval: fn => { scan = fn; },
    chrome: { runtime: {
      onMessage: { addListener: fn => { listener = fn; } },
      sendMessage: value => value.type === "settings:get" ? Promise.resolve({ settings: { enabled: true } }) :
        new Promise(resolve => requests.push({ value, resolve }))
    } }
  });
  vm.runInContext(source("shared.js"), context);
  vm.runInContext(source("content.js"), context);
  return { video, caption, player, requests, scan: () => scan(),
    settings: enabled => listener({ type: "settings:changed", settings: { enabled } }, {}, () => {}),
    status: () => { let reply; listener({ type: "status:get" }, {}, value => { reply = value; }); return reply; },
    segments: segments => receive({ source: window, origin: "https://jupiter.err.ee", data: {
      channel: "jupiter-dual-segments-v1", videoId: video.id, source: video.currentSrc, language: "und", trackId: 13, segments
    } })
  };
}

test("late translation never overwrites a newer caption; seek and disable restore originals", async () => {
  const h = contentHarness();
  await tick();
  const overlay = h.player.children[0];
  const [et, en] = overlay.children;
  assert.equal(et.textContent, "Tere õhtust.");
  assert.equal(h.requests.length, 1);
  h.scan(); h.scan();
  assert.equal(h.requests.length, 1, "polling must not create repeated requests");
  h.caption.textContent = "Head aega.";
  h.scan();
  h.requests[0].resolve({ text: "Good evening." });
  await tick();
  assert.equal(et.textContent, "Head aega.");
  assert.equal(en.textContent, "Translating…");
  h.requests[1].resolve({ text: "Goodbye." });
  await tick();
  assert.equal(en.textContent, "Goodbye.");
  h.video.seeking = true;
  h.video.events.seeking();
  assert.equal(overlay.hidden, true);
  assert.equal(h.caption.classList.contains("jupiter-dual-original-hidden"), false);
  h.video.seeking = false;
  h.scan();
  h.settings(false);
  assert.equal(overlay.hidden, true);
  assert.equal(h.caption.classList.contains("jupiter-dual-original-hidden"), false);
  const count = h.requests.length;
  h.caption.textContent = "Veel üks lause.";
  h.scan();
  assert.equal(h.requests.length, count);
});

test("manifest limits automatic scripts to Jupiter and network access to translation", () => {
  const manifest = JSON.parse(source("manifest.json"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.deepEqual(manifest.host_permissions, ["https://api.tartunlp.ai/*"]);
  for (const script of manifest.content_scripts) {
    assert.deepEqual(script.matches, ["https://jupiter.err.ee/*"]);
    for (const file of script.js) assert.ok(source(file).length);
  }
});

test("Shaka bridge exposes subtitle segments before captions display", async () => {
  let inspect;
  const emitted = [];
  const refs = [{ startTime: 0, endTime: 10, timestampOffset: 0, getUris: () => ["https://vod.err.ee/hls/vod/test/fragment-1.vtt"] }];
  const player = { getManifest: () => ({ textStreams: [{ id: 13, segmentIndex: refs }] }),
    getTextTracks: () => [{ id: 13, active: true, language: "und" }] };
  const video = { id: "shaka", currentSrc: "blob:show", ui: { getControls: () => ({ getPlayer: () => player }) } };
  const context = vm.createContext({
    window: { postMessage: (value, origin) => emitted.push({ value, origin }) },
    location: { origin: "https://jupiter.err.ee" },
    document: { querySelectorAll: () => [video] },
    setInterval: fn => { inspect = fn; }, URL
  });
  vm.runInContext(source("page-bridge.js"), context);
  inspect(); inspect();
  await tick();
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].value.segments[0].url, "https://vod.err.ee/hls/vod/test/fragment-1.vtt");
  assert.equal(emitted[0].value.segments[0].start, 0);
  assert.equal(emitted[0].origin, "https://jupiter.err.ee");
});

test("VTT parser preserves absolute times, formatting text, and MPEGTS offsets", () => {
  const context = vm.createContext({});
  vm.runInContext(source("shared.js"), context);
  const vtt = "WEBVTT\n\nNOTE\nERR Heli tekstiks\n\n1\n00:00:08.830 --> 00:00:13.150\n<v Speaker>Tere &amp; <i>õhtust.</i>\nHead vaatajad.\n\n2\ninvalid --> invalid\nIgnore this";
  const parsed = context.JupiterShared.parseVtt(vtt);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].start, 8.83);
  assert.equal(parsed[0].end, 13.15);
  assert.equal(parsed[0].text, "Tere & õhtust.\nHead vaatajad.");
  const mapped = context.JupiterShared.parseVtt("WEBVTT\nX-TIMESTAMP-MAP=LOCAL:00:00:00.000,MPEGTS:900000\n\n00:00:01.000 --> 00:00:02.000\nTere.", 0, 10);
  assert.equal(mapped[0].start, 11);
});

test("paused video pretranslates future captions and displays them with no new request", async () => {
  const h = contentHarness(async () => ({ ok: true, text: async () =>
    "WEBVTT\n\n1\n00:00:20.000 --> 00:00:24.000\nHead aega." }));
  await tick();
  h.segments([{ url: "https://vod.err.ee/test.vtt", start: 20, end: 30, offset: 0 }]);
  await tick(); await tick();
  const batch = h.requests.find(request => request.value.type === "translate:batch");
  assert.ok(batch, "must pretranslate without waiting for playback or caption display");
  assert.equal(batch.value.texts[0], "Head aega.");
  batch.resolve({ results: [{ text: "Goodbye." }] });
  await tick();
  assert.equal(h.status().prepared, 1);
  h.caption.textContent = "Head aega.";
  h.video.currentTime = 21;
  const count = h.requests.length;
  h.scan();
  assert.equal(h.player.children[0].children[1].textContent, "Goodbye.");
  assert.equal(h.requests.length, count);
});
