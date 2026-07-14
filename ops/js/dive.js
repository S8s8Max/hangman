/* DIVEコンソール: 集中セッションのタイマー制御と記録 */
const Dive = (() => {
  "use strict";

  const { state, save, escapeHtml } = Store;

  const idleView = document.getElementById("dive-idle");
  const activeView = document.getElementById("dive-active");
  const missionSel = document.getElementById("dive-mission");
  const durationBtns = document.getElementById("duration-btns");
  const btnDive = document.getElementById("btn-dive");
  const btnAbort = document.getElementById("btn-abort");
  const timerEl = document.getElementById("dive-timer");
  const targetEl = document.getElementById("dive-target");
  const depthEl = document.getElementById("dive-depth");
  const wave = document.getElementById("dive-wave");
  const wctx = wave.getContext("2d");

  let tickId = null;
  let waveId = null;

  // ── 潜行対象セレクタ ──
  function renderMissionSelect() {
    const open = state.missions.filter((m) => m.status !== "done");
    missionSel.innerHTML =
      `<option value="">(任務を指定しない自由潜行)</option>` +
      open.map((m) => `<option value="${m.id}">[${m.threat}] ${escapeHtml(m.title)}</option>`).join("");
  }

  // ── 時間選択 ──
  durationBtns.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-min]");
    if (!btn) return;
    durationBtns.querySelectorAll("button").forEach((b) => b.classList.remove("sel"));
    btn.classList.add("sel");
    state.settings.duration = Number(btn.dataset.min);
    save();
  });

  function syncDurationButtons() {
    durationBtns.querySelectorAll("button").forEach((b) =>
      b.classList.toggle("sel", Number(b.dataset.min) === state.settings.duration));
  }

  // ── 通知音 (WebAudio・音源ファイル不要) ──
  function beep() {
    try {
      const ac = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18, 0.36].forEach((t, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain).connect(ac.destination);
        osc.frequency.value = i === 2 ? 1320 : 880;
        gain.gain.setValueAtTime(0.12, ac.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.15);
        osc.start(ac.currentTime + t);
        osc.stop(ac.currentTime + t + 0.16);
      });
    } catch { /* 音が出せない環境では無視 */ }
  }

  function notify(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  // ── 潜行開始 / 終了 ──
  function start() {
    const durationMin = state.settings.duration;
    state.activeDive = {
      missionId: missionSel.value ? Number(missionSel.value) : null,
      start: new Date().toISOString(),
      durationMin,
      endTime: Date.now() + durationMin * 60000,
    };
    save();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    enterDiveView();
  }

  function finish(completed) {
    const dive = state.activeDive;
    if (!dive) return;
    const elapsedMin = completed
      ? dive.durationMin
      : Math.floor((Date.now() - new Date(dive.start).getTime()) / 60000);
    if (elapsedMin >= 1) {
      state.dives.push({
        id: Date.now(),
        missionId: dive.missionId,
        start: dive.start,
        minutes: elapsedMin,
        completed,
      });
    }
    state.activeDive = null;
    save();
    exitDiveView();
    if (completed) {
      beep();
      notify("GHOST://OPS — 浮上", `潜行完了: ${dive.durationMin}分の集中を記録しました`);
    }
  }

  btnDive.addEventListener("click", start);
  btnAbort.addEventListener("click", () => finish(false));

  // ── 表示制御 ──
  function missionTitle(id) {
    const m = state.missions.find((x) => x.id === id);
    return m ? m.title : "自由潜行 — FREE DIVE";
  }

  function enterDiveView() {
    idleView.classList.add("hidden");
    activeView.classList.remove("hidden");
    document.body.classList.add("diving");
    targetEl.textContent = missionTitle(state.activeDive.missionId);
    tick();
    tickId = setInterval(tick, 1000);
    waveId = requestAnimationFrame(drawWave);
  }

  function exitDiveView() {
    clearInterval(tickId);
    cancelAnimationFrame(waveId);
    idleView.classList.remove("hidden");
    activeView.classList.add("hidden");
    document.body.classList.remove("diving");
  }

  function tick() {
    const dive = state.activeDive;
    if (!dive) return;
    const remain = Math.max(0, dive.endTime - Date.now());
    const totalSec = Math.round(remain / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    timerEl.textContent = `${mm}:${ss}`;
    timerEl.classList.toggle("closing", totalSec <= 60);
    document.title = `${mm}:${ss} ▼ DIVING — GHOST://OPS`;

    const progress = 1 - remain / (dive.durationMin * 60000);
    depthEl.style.width = (progress * 100).toFixed(1) + "%";

    if (remain <= 0) {
      document.title = "GHOST://OPS — ミッション管理・DIVE端末";
      finish(true);
    }
  }

  let t = 0;
  function drawWave() {
    const w = wave.width = wave.clientWidth || 300;
    const h = wave.height;
    wctx.clearRect(0, 0, w, h);
    wctx.strokeStyle = "#00e5c0";
    wctx.lineWidth = 1.4;
    wctx.shadowColor = "rgba(0,229,192,0.6)";
    wctx.shadowBlur = 5;
    wctx.beginPath();
    for (let x = 0; x < w; x++) {
      const y = h / 2
        + Math.sin((x + t) * 0.045) * 9
        + Math.sin((x + t) * 0.11) * 5
        + (Math.random() - 0.5) * 3;
      x === 0 ? wctx.moveTo(x, y) : wctx.lineTo(x, y);
    }
    wctx.stroke();
    t += 2.5;
    waveId = requestAnimationFrame(drawWave);
  }

  // ── リロード時の潜行復帰 ──
  function resume() {
    const dive = state.activeDive;
    if (!dive) return;
    if (Date.now() >= dive.endTime) {
      // 潜行中にページを閉じていた場合も完了として記録
      finish(true);
    } else {
      enterDiveView();
    }
  }

  Store.onChange(renderMissionSelect);
  renderMissionSelect();
  syncDurationButtons();
  resume();

  return {};
})();
