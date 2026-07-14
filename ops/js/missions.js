/* ミッションボード: 追加・状態遷移・削除・一覧描画 */
const Missions = (() => {
  "use strict";

  const { state, save, escapeHtml } = Store;

  const form = document.getElementById("mission-form");
  const titleEl = document.getElementById("m-title");
  const threatEl = document.getElementById("m-threat");
  const deadlineEl = document.getElementById("m-deadline");
  const listEl = document.getElementById("mission-list");
  const summaryEl = document.getElementById("mission-summary");

  const STATUS_FLOW = { standby: "active", active: "done", done: "standby" };
  const STATUS_LABEL = { standby: "STANDBY", active: "ACTIVE", done: "COMPLETE" };
  const THREAT_ORDER = { A: 0, B: 1, C: 2 };
  const STATUS_ORDER = { active: 0, standby: 1, done: 2 };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = titleEl.value.trim();
    if (!title) return;
    state.missions.push({
      id: Date.now(),
      title,
      threat: threatEl.value,
      deadline: deadlineEl.value || null,
      status: "standby",
      createdAt: new Date().toISOString(),
    });
    titleEl.value = "";
    deadlineEl.value = "";
    save();
  });

  listEl.addEventListener("click", (e) => {
    const statusBtn = e.target.closest(".m-status");
    if (statusBtn) {
      const m = state.missions.find((x) => x.id === Number(statusBtn.dataset.id));
      if (m) { m.status = STATUS_FLOW[m.status]; save(); }
      return;
    }
    const delBtn = e.target.closest(".m-del");
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      const m = state.missions.find((x) => x.id === id);
      if (m && confirm(`ミッション「${m.title}」を抹消しますか?`)) {
        state.missions = state.missions.filter((x) => x.id !== id);
        save();
      }
    }
  });

  function focusMinutes(missionId) {
    return state.dives
      .filter((d) => d.missionId === missionId)
      .reduce((sum, d) => sum + d.minutes, 0);
  }

  function deadlineMeta(m) {
    if (!m.deadline) return "";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dl = new Date(m.deadline + "T00:00:00");
    const days = Math.round((dl - today) / 86400000);
    if (m.status === "done") return `期限 ${m.deadline}`;
    if (days < 0) return `<span class="overdue">期限超過 ${-days}日</span>`;
    if (days === 0) return `<span class="overdue">本日期限</span>`;
    return `残り ${days}日`;
  }

  function sorted() {
    return [...state.missions].sort((a, b) =>
      (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) ||
      (THREAT_ORDER[a.threat] - THREAT_ORDER[b.threat]) ||
      ((a.deadline || "9999") < (b.deadline || "9999") ? -1 : 1)
    );
  }

  function render() {
    const missions = sorted();
    if (missions.length === 0) {
      listEl.innerHTML = `<li class="mission-empty">任務はありません。上のフォームから新規ミッションを割り当ててください。</li>`;
    } else {
      listEl.innerHTML = missions.map((m) => {
        const min = focusMinutes(m.id);
        return `
        <li class="mission-item ${m.status === "done" ? "done" : ""}">
          <span class="threat threat-${m.threat}">${m.threat}</span>
          <button class="m-status st-${m.status}" data-id="${m.id}" title="クリックで状態変更">${STATUS_LABEL[m.status]}</button>
          <span class="m-title" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</span>
          <span class="m-meta">${deadlineMeta(m)}${min > 0 ? ` <span class="focus-min">Σ${min}min</span>` : ""}</span>
          <button class="m-del" data-id="${m.id}" title="削除">✕</button>
        </li>`;
      }).join("");
    }
    const open = state.missions.filter((m) => m.status !== "done").length;
    summaryEl.textContent = `OPEN: ${open} / TOTAL: ${state.missions.length}`;
  }

  // ── エクスポート / インポート ──
  document.getElementById("btn-export").addEventListener("click", Store.exportJson);
  const importFile = document.getElementById("import-file");
  document.getElementById("btn-import").addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    const file = importFile.files[0];
    if (!file) return;
    if (!confirm("現在のデータをインポート内容で上書きします。よろしいですか?")) return;
    Store.importJson(file).catch(() => alert("インポート失敗: JSONの形式が不正です"));
    importFile.value = "";
  });

  Store.onChange(render);
  render();

  return { render };
})();
