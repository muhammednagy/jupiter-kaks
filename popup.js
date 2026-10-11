(() => {
  const $ = id => document.getElementById(id);
  const ids = ["enabled", "fontSize", "bottom"];
  const message = value => chrome.runtime.sendMessage(value);
  let timer;
  let writes = Promise.resolve();
  function labels() {
    $("fontSizeValue").textContent = `${$("fontSize").value} px`;
    $("bottomValue").textContent = `${$("bottom").value}%`;
  }
  async function status() {
    if (!$("enabled").checked) { $("status").textContent = "English translations are off."; return; }
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const reply = await chrome.tabs.sendMessage(tab.id, { type: "status:get" });
      const preparation = reply.total ? `${reply.prepared} / ${reply.total} captions translated ahead${reply.loading ? " · Loading subtitles…" : ""}.` :
        reply.active ? "Captions detected. English translations are on." : reply.players ?
        "Loading subtitles. Turn on Estonian captions in the player." : "Start a Jupiter or Lasteekraan show to see both languages.";
      $("status").textContent = reply.error ? `${preparation} ${reply.error}` : preparation;
    } catch { $("status").textContent = "Open a show on jupiter.err.ee or lasteekraan.err.ee. Refresh the page after installing."; }
  }
  function save() {
    const value = { enabled: $("enabled").checked, fontSize: Number($("fontSize").value), bottom: Number($("bottom").value) };
    writes = writes.catch(() => {}).then(async () => {
      const reply = await message({ type: "settings:set", settings: value });
      if (reply.error) throw new Error(reply.error);
      await status();
    }).catch(error => { $("status").textContent = error.message; });
  }
  async function count() { $("cacheCount").textContent = `${(await message({ type: "cache:count" })).count || 0} saved captions`; }
  async function init() {
    const reply = await message({ type: "settings:get" });
    if (reply.error) throw new Error(reply.error);
    const value = JupiterShared.settings(reply.settings);
    $("enabled").checked = value.enabled;
    $("fontSize").value = value.fontSize;
    $("bottom").value = value.bottom;
    labels();
    await Promise.all([status(), count()]);
    setInterval(() => { void status(); void count(); }, 2000);
    for (const id of ids) {
      $(id).addEventListener("input", () => { labels(); clearTimeout(timer); timer = setTimeout(save, 150); });
      $(id).addEventListener("change", () => { clearTimeout(timer); save(); });
    }
    $("clearCache").addEventListener("click", async () => {
      try { await message({ type: "cache:clear" }); await count(); } catch { $("status").textContent = "Could not clear translations. Reload the extension."; }
    });
  }
  void init().catch(error => { $("status").textContent = error.message; });
})();
