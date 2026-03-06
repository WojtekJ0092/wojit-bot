// ---------------------------------------------------------------------------
// NewsPanel — slide-out world news panel with topic search
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  thumbnail: string;
  source: string;
}

/* Use Vite dev proxy to avoid CORS issues */
function rss2jsonUrl(rssUrl: string): string {
  return `/api/news?rss_url=${encodeURIComponent(rssUrl)}`;
}

const BBC_RSS = "https://feeds.bbci.co.uk/news/world/rss.xml";

async function fetchNews(rssUrl: string, sourceName: string): Promise<NewsItem[]> {
  // rss2json has CORS headers, try it directly
  const apiUrl = rss2jsonUrl(rssUrl);
  console.log("[NewsPanel] Fetching:", apiUrl);

  const res = await fetch(apiUrl);
  console.log("[NewsPanel] Response status:", res.status);

  if (!res.ok) {
    const text = await res.text();
    console.error("[NewsPanel] Error body:", text);
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
  }

  const json = await res.json();
  console.log("[NewsPanel] JSON status:", json.status, "items:", json.items?.length);

  if (json.status !== "ok") {
    throw new Error(json.message || "RSS feed returned error");
  }

  const items = json.items ?? [];
  if (items.length === 0) {
    throw new Error("No articles found");
  }

  return items.slice(0, 20).map((item: any) => ({
    title: item.title ?? "",
    link: item.link ?? "#",
    description: (item.description ?? item.content ?? "").replace(/<[^>]+>/g, "").slice(0, 140),
    pubDate: item.pubDate ?? item.published ?? "",
    thumbnail: item.thumbnail || item.enclosure?.link || "",
    source: item.author || sourceName,
  }));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NewsPanel() {
  const [open, setOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNews = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchNews(BBC_RSS, "BBC World")
      .then(setNews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch on first open
  useEffect(() => {
    if (open && news.length === 0 && !loading) loadNews();
  }, [open, news.length, loading, loadNews]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="news" ref={panelRef}>
      <button
        className="news__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle world news"
        title="World News"
      >
        🌍
      </button>

      <div className={`news__panel ${open ? "news__panel--open" : ""}`}>
        <div className="news__header">
          <h2 className="news__title">🌍 World News</h2>
          <button className="news__refresh" onClick={loadNews} disabled={loading} title="Refresh">
            🔄
          </button>
        </div>

        <div className="news__content">
          {loading && (
            <div className="news__loading">
              <span className="thinking-dots">
                <span className="thinking-dots__dot" />
                <span className="thinking-dots__dot" />
                <span className="thinking-dots__dot" />
              </span>
            </div>
          )}

          {error && (
            <div className="news__error">
              Failed to load news. <button onClick={loadNews}>Retry</button>
            </div>
          )}

          {!loading && !error && news.length === 0 && (
            <div className="news__empty">No news available.</div>
          )}

          {news.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="news__item"
            >
              {item.thumbnail && (
                <img
                  className="news__thumb"
                  src={item.thumbnail}
                  alt=""
                  loading="lazy"
                />
              )}
              <div className="news__item-body">
                <span className="news__item-title">{item.title}</span>
                <span className="news__item-desc">{item.description}</span>
                <div className="news__item-meta">
                  <span className="news__item-source">{item.source}</span>
                  <span className="news__item-time">{timeAgo(item.pubDate)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
