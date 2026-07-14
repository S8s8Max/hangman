/* 潜行記録統計: スタットタイル + 15週間シアン逐次スケールのヒートマップ */
const Stats = (() => {
  "use strict";

  const { state, dayKey } = Store;

  const todayEl = document.getElementById("st-today");
  const weekEl = document.getElementById("st-week");
  const streakEl = document.getElementById("st-streak");
  const divesEl = document.getElementById("st-dives");
  const heatmapEl = document.getElementById("heatmap");

  const WEEKS = 15;

  function minutesByDay() {
    const map = {};
    for (const d of state.dives) {
      const key = dayKey(d.start);
      map[key] = (map[key] || 0) + d.minutes;
    }
    return map;
  }

  function computeStreak(byDay) {
    let streak = 0;
    const cursor = new Date();
    // 今日まだ潜行していなくても昨日までの連続を維持
    if (!byDay[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
    while (byDay[dayKey(cursor)]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function level(min) {
    if (!min) return 0;
    if (min < 25) return 1;
    if (min < 60) return 2;
    if (min < 120) return 3;
    return 4;
  }

  function render() {
    const byDay = minutesByDay();
    const todayKey = dayKey(Date.now());

    todayEl.textContent = byDay[todayKey] || 0;

    let week = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      week += byDay[dayKey(d)] || 0;
    }
    weekEl.textContent = week;
    streakEl.textContent = computeStreak(byDay);
    divesEl.textContent = state.dives.length;

    // ── ヒートマップ (直近 WEEKS 週間、週の始まりは日曜) ──
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (WEEKS * 7 - 1) - end.getDay());

    const cells = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = dayKey(cursor);
      const min = byDay[key] || 0;
      const label = `${key}: ${min}分`;
      const isToday = key === todayKey ? " today" : "";
      cells.push(`<span class="hm-cell l${level(min)}${isToday}" title="${label}"></span>`);
      cursor.setDate(cursor.getDate() + 1);
    }
    heatmapEl.innerHTML = cells.join("");
  }

  Store.onChange(render);
  render();

  return { render };
})();
