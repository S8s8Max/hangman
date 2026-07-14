/* メインクロック + セッションアップタイム */
(() => {
  "use strict";

  const clockEl = document.getElementById("clock-main");
  const dateEl = document.getElementById("clock-date");
  const uptimeEl = document.getElementById("uptime");
  const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const start = Date.now();

  function pad(n) { return String(n).padStart(2, "0"); }

  function tick() {
    const now = new Date();
    clockEl.textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    dateEl.textContent =
      `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${DAYS[now.getDay()]}`;

    const up = Math.floor((Date.now() - start) / 1000);
    uptimeEl.textContent =
      `${pad(Math.floor(up / 3600))}:${pad(Math.floor(up / 60) % 60)}:${pad(up % 60)}`;
  }
  tick();
  setInterval(tick, 1000);
})();
