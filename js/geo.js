/* 環境走査パネル: 位置情報・天気 (Open-Meteo)・世界時計 */
(() => {
  "use strict";

  const DEFAULT_POS = { lat: 35.6812, lon: 139.7671, label: "DEFAULT NODE: TOKYO" };

  const WMO_CODES = {
    0: "快晴", 1: "晴れ", 2: "薄曇り", 3: "曇り",
    45: "霧", 48: "着氷性の霧",
    51: "弱い霧雨", 53: "霧雨", 55: "強い霧雨",
    61: "弱い雨", 63: "雨", 65: "強い雨",
    66: "着氷性の雨", 67: "強い着氷性の雨",
    71: "弱い雪", 73: "雪", 75: "強い雪", 77: "霧雪",
    80: "にわか雨", 81: "強いにわか雨", 82: "激しいにわか雨",
    85: "にわか雪", 86: "強いにわか雪",
    95: "雷雨", 96: "雹を伴う雷雨", 99: "激しい雹を伴う雷雨",
  };

  const latEl = document.getElementById("geo-lat");
  const lonEl = document.getElementById("geo-lon");
  const srcEl = document.getElementById("geo-source");
  const tempEl = document.getElementById("wx-temp");
  const descEl = document.getElementById("wx-desc");
  const wxTable = document.getElementById("wx-table");

  async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,pressure_msl,weather_code` +
      `&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("weather API " + res.status);
    const data = await res.json();
    const c = data.current;

    tempEl.textContent = c.temperature_2m.toFixed(1);
    descEl.textContent = WMO_CODES[c.weather_code] || `CODE:${c.weather_code}`;
    wxTable.innerHTML = [
      ["体感温度", `${c.apparent_temperature.toFixed(1)} °C`],
      ["湿度", `${c.relative_humidity_2m} %`],
      ["風速 / 風向", `${c.wind_speed_10m} km/h / ${c.wind_direction_10m}°`],
      ["海面気圧", `${c.pressure_msl} hPa`],
    ].map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("");
  }

  function setPosition(lat, lon, label) {
    latEl.textContent = lat.toFixed(4);
    lonEl.textContent = lon.toFixed(4);
    srcEl.textContent = "POSITION: " + label;
    fetchWeather(lat, lon).catch(() => {
      descEl.textContent = "気象データ取得不能 — LINK ERROR";
    });
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition(pos.coords.latitude, pos.coords.longitude,
        `GPS FIX (精度 ±${Math.round(pos.coords.accuracy)}m)`),
      () => setPosition(DEFAULT_POS.lat, DEFAULT_POS.lon, DEFAULT_POS.label),
      { timeout: 8000 }
    );
  } else {
    setPosition(DEFAULT_POS.lat, DEFAULT_POS.lon, DEFAULT_POS.label);
  }

  // ── 世界時計 ──
  const CITIES = [
    ["TOKYO", "Asia/Tokyo"],
    ["LONDON", "Europe/London"],
    ["NEW YORK", "America/New_York"],
    ["HONG KONG", "Asia/Hong_Kong"],
  ];
  const wcWrap = document.getElementById("world-clocks");
  wcWrap.innerHTML = CITIES.map(([city]) =>
    `<div class="world-clock"><div class="wc-city">${city}</div><div class="wc-time" data-city="${city}">--:--</div></div>`
  ).join("");

  function updateClocks() {
    const now = new Date();
    for (const [city, tz] of CITIES) {
      const el = wcWrap.querySelector(`[data-city="${city}"]`);
      el.textContent = now.toLocaleTimeString("ja-JP", {
        timeZone: tz, hour: "2-digit", minute: "2-digit",
      });
    }
  }
  updateClocks();
  setInterval(updateClocks, 15000);
})();
