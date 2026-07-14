/* ヘッダークロック */
(() => {
  "use strict";

  const clockEl = document.getElementById("clock-main");
  function pad(n) { return String(n).padStart(2, "0"); }

  function tick() {
    const now = new Date();
    clockEl.textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }
  tick();
  setInterval(tick, 1000);
})();
