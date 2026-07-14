/* 外部記憶解析パネル: 手入力データの記録 (localStorage) と可視化 */
(() => {
  "use strict";

  const STORAGE_KEY = "ghost_terminal_datalog";

  const form = document.getElementById("log-form");
  const catEl = document.getElementById("log-category");
  const valEl = document.getElementById("log-value");
  const noteEl = document.getElementById("log-note");
  const clearBtn = document.getElementById("log-clear");
  const listEl = document.getElementById("log-list");
  const chart = document.getElementById("log-chart");
  const ctx = chart.getContext("2d");

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }
  function save(entries) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  let entries = load();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = parseFloat(valEl.value);
    if (!isFinite(value)) return;
    entries.push({
      id: Date.now(),
      ts: new Date().toISOString(),
      category: catEl.value,
      value,
      note: noteEl.value.trim(),
    });
    save(entries);
    valEl.value = "";
    noteEl.value = "";
    render();
  });

  clearBtn.addEventListener("click", () => {
    if (entries.length === 0) return;
    if (confirm("全ログを消去します。記憶の外部化は取り消せません。よろしいですか?")) {
      entries = [];
      save(entries);
      render();
    }
  });

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".del");
    if (!btn) return;
    entries = entries.filter((en) => en.id !== Number(btn.dataset.id));
    save(entries);
    render();
  });

  function fmtTs(iso) {
    const d = new Date(iso);
    return d.toLocaleString("ja-JP", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  function renderList() {
    if (entries.length === 0) {
      listEl.innerHTML = `<li class="log-empty">NO DATA — 記録を追加してください</li>`;
      return;
    }
    listEl.innerHTML = [...entries].reverse().slice(0, 50).map((en) => `
      <li>
        <span class="ts">${fmtTs(en.ts)}</span>
        <span class="cat">[${en.category}]</span>
        <span class="val">${en.value.toLocaleString("ja-JP")}</span>
        <span class="note">${escapeHtml(en.note)}</span>
        <button class="del" data-id="${en.id}" title="削除">✕</button>
      </li>`).join("");
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  /* カテゴリ別合計の横棒グラフ (単一色シアン・直接ラベル) */
  function renderChart() {
    const w = chart.width = chart.clientWidth || 500;
    const h = chart.height;
    ctx.clearRect(0, 0, w, h);

    const totals = {};
    for (const en of entries) {
      totals[en.category] = (totals[en.category] || 0) + en.value;
    }
    const cats = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (cats.length === 0) {
      ctx.fillStyle = "#5da093";
      ctx.font = "12px 'Share Tech Mono', monospace";
      ctx.fillText("NO DATA", 10, 24);
      return;
    }

    const max = Math.max(...cats.map(([, v]) => v));
    const labelW = 64;
    const valueW = 84;
    const barArea = w - labelW - valueW;
    const rowH = Math.min(34, (h - 10) / cats.length);
    const barH = Math.min(14, rowH - 8);

    cats.forEach(([cat, total], i) => {
      const y = 8 + i * rowH;
      const bw = Math.max(2, (total / max) * barArea);

      ctx.fillStyle = "#5da093";
      ctx.font = "11px 'Noto Sans JP', sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(cat, 2, y + barH / 2);

      ctx.fillStyle = "#00e5c0";
      ctx.shadowColor = "rgba(0,229,192,0.5)";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.roundRect(labelW, y, bw, barH, [0, 4, 4, 0]);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#c8f5ea";
      ctx.font = "11px 'Share Tech Mono', monospace";
      ctx.fillText(total.toLocaleString("ja-JP"), labelW + bw + 8, y + barH / 2);
    });
  }

  function render() {
    renderList();
    renderChart();
  }
  render();
  window.addEventListener("resize", renderChart);
})();
