/* 永続化ストア (localStorage) と共有ユーティリティ */
const Store = (() => {
  "use strict";

  const KEY = "ghost_ops_state";

  const defaults = () => ({
    missions: [],   // {id, title, threat, deadline, status, createdAt}
    dives: [],      // {id, missionId, start, minutes, completed}
    settings: { duration: 25 },
    activeDive: null, // {missionId, start, durationMin, endTime}
  });

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw || !Array.isArray(raw.missions)) return defaults();
      return { ...defaults(), ...raw };
    } catch {
      return defaults();
    }
  }

  const state = load();
  const listeners = [];

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    listeners.forEach((fn) => fn(state));
  }

  function onChange(fn) { listeners.push(fn); }

  /* ローカル日付キー YYYY-MM-DD */
  function dayKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  /* エクスポート / インポート */
  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ghost-ops-backup-${dayKey(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(file) {
    return file.text().then((text) => {
      const data = JSON.parse(text);
      if (!Array.isArray(data.missions) || !Array.isArray(data.dives)) {
        throw new Error("invalid format");
      }
      state.missions = data.missions;
      state.dives = data.dives;
      state.settings = { ...state.settings, ...(data.settings || {}) };
      state.activeDive = null;
      save();
    });
  }

  return { state, save, onChange, dayKey, escapeHtml, exportJson, importJson };
})();
