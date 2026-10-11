importScripts("shared.js");

const { normalize, settings, translationTexts } = JupiterShared;
const CACHE_KEY = "translations-tartunlp-v1";
const THROTTLE_KEY = "translation-throttle-tartunlp-v1";
const MAX_CACHE = 1500;
const cache = new Map();
const pending = new Map();
let queue = [];
let running = false;
let cooldownUntil = 0;
let lastRequest = 0;
let rateStrikes = 0;
let pumpTimer;
let cacheWrite = Promise.resolve();
let cacheGeneration = 0;

const ready = (async () => {
  await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  const stored = await chrome.storage.local.get(CACHE_KEY);
  for (const item of (stored[CACHE_KEY] || []).slice(-MAX_CACHE)) {
    if (Array.isArray(item) && typeof item[0] === "string" && typeof item[1] === "string") {
      cache.set(item[0], item[1]);
    }
  }
  const throttle = (await chrome.storage.local.get(THROTTLE_KEY))[THROTTLE_KEY] || {};
  cooldownUntil = Number(throttle.cooldownUntil) || 0;
  lastRequest = Number(throttle.lastRequest) || 0;
  rateStrikes = Number(throttle.rateStrikes) || 0;
})();

function isSupportedSite(sender) {
  try { return ["https://jupiter.err.ee", "https://lasteekraan.err.ee"].includes(new URL(sender.url).origin); } catch { return false; }
}
function isPopup(sender) {
  return sender.id === chrome.runtime.id && sender.url === chrome.runtime.getURL("popup.html");
}
function saveCache() {
  const snapshot = [...cache];
  cacheWrite = cacheWrite.catch(() => {}).then(() => chrome.storage.local.set({ [CACHE_KEY]: snapshot }));
  return cacheWrite;
}
function remember(text, translation) {
  cache.delete(text);
  cache.set(text, translation);
  while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  // A cache write must not make a successful translation fail.
  void saveCache().catch(() => {});
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function saveThrottle() {
  return chrome.storage.local.set({ [THROTTLE_KEY]: { cooldownUntil, lastRequest, rateStrikes } });
}
function schedulePump() {
  if (running || pumpTimer) return;
  // Let all captions from one batch enter the queue before starting its request.
  pumpTimer = setTimeout(() => { pumpTimer = undefined; void pump(); }, 50);
}
function rateLimitError() {
  const seconds = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
  const error = new Error(`Neurotõlge is temporarily unavailable. Retrying in ${seconds} seconds.`);
  error.retryAfter = seconds * 1000;
  return error;
}
async function translate(texts) {
  if (Date.now() < cooldownUntil) throw rateLimitError();
  await sleep(Math.max(0, 1500 - (Date.now() - lastRequest)));
  lastRequest = Date.now();
  await saveThrottle();
  let response;
  try {
    response = await fetch("https://api.tartunlp.ai/translation/v2", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: texts, src: "et", tgt: "en", domain: "general", application: "Jupiter Dual Subtitles" }),
      credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(30000)
    });
  } catch {
    const error = new Error("Could not reach Neurotõlge. Check your connection and retry.");
    error.retryAfter = 10000;
    throw error;
  }
  if (response.status === 429 || response.status === 503) {
    rateStrikes = Math.min(5, rateStrikes + 1);
    const retrySeconds = Math.max(Math.min(900, 60 * 2 ** (rateStrikes - 1)), Number(response.headers.get("Retry-After")) || 0);
    cooldownUntil = Date.now() + retrySeconds * 1000;
    await saveThrottle();
    throw rateLimitError();
  }
  if (!response.ok) throw new Error(`Neurotõlge returned HTTP ${response.status}. Try again later.`);
  const translated = translationTexts(await response.json(), texts.length);
  if (rateStrikes) { rateStrikes = 0; cooldownUntil = 0; await saveThrottle(); }
  return translated;
}
async function pump() {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      queue.sort((a, b) => Number(b.priority) - Number(a.priority));
      const jobs = [queue.shift()];
      let chars = jobs[0].text.length;
      if (!jobs[0].priority) {
        while (queue.length && jobs.length < 12 && !queue[0].priority && chars + queue[0].text.length < 3500) {
          jobs.push(queue.shift());
          chars += jobs.at(-1).text.length;
        }
      }
      try {
        // The documented API accepts and returns arrays in the same order.
        const translations = await translate(jobs.map(job => job.text));
        for (let i = 0; i < jobs.length; i++) {
          const job = jobs[i];
          if (job.generation === cacheGeneration) remember(job.text, translations[i]);
          job.resolve({ text: translations[i] });
        }
      } catch (error) {
        for (const job of jobs) job.resolve({ error: error.message, retryAfter: error.retryAfter || 15000 });
      } finally {
        for (const job of jobs) pending.delete(job.text);
      }
    }
  } finally { running = false; }
}
async function requestTranslation(text, priority = false) {
  await ready;
  text = normalize(text);
  if (!text || text.length > 1500) return { error: "Caption is empty or too long." };
  const stored = await chrome.storage.local.get("settings");
  if (!settings(stored.settings).enabled) return { error: "English subtitles are turned off." };
  if (cache.has(text)) return { text: cache.get(text), cached: true };
  if (pending.has(text)) {
    const job = pending.get(text);
    job.priority ||= priority;
    return job.promise;
  }
  if (Date.now() < cooldownUntil) {
    const error = rateLimitError();
    return { error: error.message, retryAfter: error.retryAfter };
  }
  if (queue.length >= 30) return { error: "Translation queue is busy.", retryAfter: 2000 };
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  const job = { text, priority, promise, resolve, generation: cacheGeneration };
  pending.set(text, job);
  queue.push(job);
  schedulePump();
  return promise;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || sender.id !== chrome.runtime.id) return;
  const popup = isPopup(sender);
  if (!popup && !isSupportedSite(sender)) return;
  let task;
  if (message.type === "translate") {
    task = requestTranslation(message.text, message.priority === true);
  } else if (message.type === "translate:batch") {
    if (!Array.isArray(message.texts) || !message.texts.length || message.texts.length > 12 ||
        message.texts.some(text => typeof text !== "string" || text.length > 1500)) return;
    task = Promise.all(message.texts.map(text => requestTranslation(text))).then(results => ({ results }));
  } else if (message.type === "settings:get") {
    task = ready.then(async () => ({ settings: settings((await chrome.storage.local.get("settings")).settings) }));
  } else if (message.type === "settings:set" && popup) {
    task = ready.then(async () => {
      const value = settings(message.settings);
      await chrome.storage.local.set({ settings: value });
      if (!value.enabled) {
        for (const job of queue) {
          job.resolve({ error: "English subtitles are turned off." });
          pending.delete(job.text);
        }
        queue = [];
      }
      // No tabs permission: URLs are never read here. Notify only tabs where our script exists.
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) void chrome.tabs.sendMessage(tab.id, { type: "settings:changed", settings: value }).catch(() => {});
      }
      return { settings: value };
    });
  } else if (message.type === "cache:clear" && popup) {
    task = ready.then(async () => {
      cacheGeneration++;
      cache.clear();
      await saveCache();
      return { cleared: true };
    });
  } else if (message.type === "cache:count" && popup) {
    task = ready.then(() => ({ count: cache.size }));
  } else return;
  Promise.resolve(task).then(sendResponse, () => sendResponse({ error: "Extension storage is unavailable. Reload the extension." }));
  return true;
});
