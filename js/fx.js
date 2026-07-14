/* 背景のデジタルレイン + ブートシーケンス */
(() => {
  "use strict";

  // ── デジタルレイン ──
  const canvas = document.getElementById("rain-canvas");
  const ctx = canvas.getContext("2d");
  const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEF<>:/\\|=+*";
  const FONT_SIZE = 14;
  let columns = 0;
  let drops = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / FONT_SIZE);
    drops = Array.from({ length: columns }, () => Math.random() * -60);
  }
  window.addEventListener("resize", resize);
  resize();

  function drawRain() {
    ctx.fillStyle = "rgba(3, 8, 7, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${FONT_SIZE}px monospace`;
    for (let i = 0; i < columns; i++) {
      const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      const y = drops[i] * FONT_SIZE;
      ctx.fillStyle = Math.random() < 0.04 ? "#9ffff0" : "#0a7a68";
      ctx.fillText(ch, i * FONT_SIZE, y);
      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += 0.5 + Math.random() * 0.3;
    }
  }
  setInterval(drawRain, 66);

  // ── ブートシーケンス ──
  const BOOT_LINES = [
    "GHOST://TERMINAL BIOS v2.9.01",
    "MEMORY CHECK ................ OK",
    "CYBERBRAIN LINK ............. OK",
    "GHOST LINE VERIFICATION ..... OK",
    "ATTACK BARRIER .............. STANDBY",
    "EXTERNAL MEMORY SYNC ........ OK",
    "接続を確立しています…",
    "WELCOME, OPERATIVE.",
  ];
  const overlay = document.getElementById("boot-overlay");
  const log = document.getElementById("boot-log");
  const app = document.getElementById("app");

  let line = 0;
  function typeNext() {
    if (line >= BOOT_LINES.length) {
      setTimeout(() => {
        overlay.classList.add("fade");
        app.classList.remove("hidden");
        setTimeout(() => overlay.remove(), 700);
      }, 400);
      return;
    }
    log.textContent += BOOT_LINES[line] + "\n";
    line++;
    setTimeout(typeNext, 130 + Math.random() * 170);
  }
  typeNext();

  // ── 疑似ニューラル波形 ──
  const wf = document.getElementById("waveform");
  const wctx = wf.getContext("2d");
  let t = 0;
  function drawWave() {
    const w = wf.width = wf.clientWidth || 300;
    const h = wf.height;
    wctx.clearRect(0, 0, w, h);
    wctx.strokeStyle = "#00e5c0";
    wctx.lineWidth = 1.4;
    wctx.shadowColor = "rgba(0,229,192,0.6)";
    wctx.shadowBlur = 5;
    wctx.beginPath();
    for (let x = 0; x < w; x++) {
      const n = Math.sin((x + t) * 0.05) * 8
              + Math.sin((x + t) * 0.13) * 5
              + (Math.random() - 0.5) * 4;
      const y = h / 2 + n;
      x === 0 ? wctx.moveTo(x, y) : wctx.lineTo(x, y);
    }
    wctx.stroke();
    t += 3;
    requestAnimationFrame(drawWave);
  }
  requestAnimationFrame(drawWave);
})();
