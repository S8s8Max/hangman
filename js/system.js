/* システム診断パネル: ブラウザ・OS・画面・バッテリー・メモリ・ネットワーク */
(() => {
  "use strict";

  const table = document.getElementById("sys-table");

  function detectOS(ua) {
    if (/windows/i.test(ua)) return "Windows";
    if (/android/i.test(ua)) return "Android";
    if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
    if (/mac os/i.test(ua)) return "macOS";
    if (/linux/i.test(ua)) return "Linux";
    return "UNKNOWN";
  }

  function detectBrowser(ua) {
    if (/edg\//i.test(ua)) return "Edge";
    if (/opr\//i.test(ua)) return "Opera";
    if (/chrome\//i.test(ua)) return "Chromium系";
    if (/firefox\//i.test(ua)) return "Firefox";
    if (/safari\//i.test(ua)) return "Safari";
    return "UNKNOWN";
  }

  function rows() {
    const ua = navigator.userAgent;
    const conn = navigator.connection || {};
    const scr = window.screen;
    return [
      ["OS / 義体規格", detectOS(ua)],
      ["BROWSER / 電脳殻", `${detectBrowser(ua)} (${navigator.language})`],
      ["DISPLAY / 視覚素子", `${scr.width}×${scr.height} @${window.devicePixelRatio}x (${scr.colorDepth}bit)`],
      ["CPU THREADS / 並列思考", navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} threads` : "N/A"],
      ["DEVICE MEMORY / 記憶容量", navigator.deviceMemory ? `≈ ${navigator.deviceMemory} GB` : "N/A"],
      ["NET TYPE / 回線種別", conn.effectiveType ? conn.effectiveType.toUpperCase() : "N/A"],
      ["DOWNLINK / 下り帯域", conn.downlink != null ? `${conn.downlink} Mbps` : "N/A"],
      ["RTT / 応答遅延", conn.rtt != null ? `${conn.rtt} ms` : "N/A"],
      ["TIMEZONE / 時間帯", Intl.DateTimeFormat().resolvedOptions().timeZone],
    ];
  }

  function render() {
    table.innerHTML = rows()
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("");
  }
  render();
  if (navigator.connection) navigator.connection.addEventListener("change", render);

  // ── バッテリー ──
  const bGauge = document.getElementById("battery-gauge");
  const bVal = document.getElementById("battery-val");
  if (navigator.getBattery) {
    navigator.getBattery().then((bat) => {
      const update = () => {
        const pct = Math.round(bat.level * 100);
        bGauge.style.width = pct + "%";
        bGauge.classList.toggle("warn", pct < 25 && !bat.charging);
        bVal.textContent = pct + "%" + (bat.charging ? " ⚡" : "");
      };
      update();
      bat.addEventListener("levelchange", update);
      bat.addEventListener("chargingchange", update);
    });
  } else {
    bVal.textContent = "N/A";
  }

  // ── JSヒープ (Chromium系のみ) ──
  const mGauge = document.getElementById("memory-gauge");
  const mVal = document.getElementById("memory-val");
  function updateMemory() {
    const mem = performance.memory;
    if (!mem) { mVal.textContent = "N/A"; return; }
    const used = mem.usedJSHeapSize / 1048576;
    const limit = mem.jsHeapSizeLimit / 1048576;
    mGauge.style.width = Math.min(100, (used / limit) * 100) + "%";
    mVal.textContent = used.toFixed(1) + " MB";
  }
  updateMemory();
  setInterval(updateMemory, 3000);

  // ── オンライン状態 ──
  const onlineEl = document.getElementById("online-status");
  function updateOnline() {
    const on = navigator.onLine;
    onlineEl.textContent = on ? "ONLINE" : "SEVERED";
    onlineEl.className = on ? "status-ok" : "status-bad";
  }
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  updateOnline();
})();
