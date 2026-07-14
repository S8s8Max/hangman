/* 傍受通信パネル: NHKニュースRSS (CORSプロキシ経由) / フォールバック: Hacker News */
(() => {
  "use strict";

  const feedList = document.getElementById("feed-list");
  const NHK_RSS = "https://www3.nhk.or.jp/rss/news/cat0.xml";
  const PROXY = "https://api.allorigins.win/raw?url=";
  const HN_API = "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=12";

  function fmtTime(date) {
    if (!date || isNaN(date)) return "--:--";
    return date.toLocaleString("ja-JP", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  function renderItems(items, srcLabel) {
    feedList.innerHTML = items.map((it) => `
      <li>
        <span class="f-ts">${fmtTime(it.date)}</span>
        <span class="feed-src">${srcLabel}</span>
        <a href="${it.link}" target="_blank" rel="noopener noreferrer">${it.title}</a>
      </li>`).join("");
  }

  async function fetchNHK() {
    const res = await fetch(PROXY + encodeURIComponent(NHK_RSS));
    if (!res.ok) throw new Error("proxy " + res.status);
    const xml = new DOMParser().parseFromString(await res.text(), "text/xml");
    const items = [...xml.querySelectorAll("item")].slice(0, 12).map((item) => ({
      title: item.querySelector("title")?.textContent ?? "(no title)",
      link: item.querySelector("link")?.textContent ?? "#",
      date: new Date(item.querySelector("pubDate")?.textContent ?? NaN),
    }));
    if (items.length === 0) throw new Error("empty feed");
    renderItems(items, "NHK");
  }

  async function fetchHN() {
    const res = await fetch(HN_API);
    if (!res.ok) throw new Error("HN " + res.status);
    const data = await res.json();
    const items = data.hits.map((hit) => ({
      title: hit.title,
      link: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      date: new Date(hit.created_at),
    }));
    renderItems(items, "HN");
  }

  async function loadFeed() {
    try {
      await fetchNHK();
    } catch {
      try {
        await fetchHN();
      } catch {
        feedList.innerHTML =
          `<li class="feed-loading">通信傍受失敗 — ALL CHANNELS SILENT (ネットワークを確認してください)</li>`;
      }
    }
  }

  loadFeed();
  setInterval(loadFeed, 10 * 60 * 1000); // 10分ごとに更新
})();
