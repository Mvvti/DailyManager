import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type QuickLink = { id: string; label: string; url: string; emoji: string };

const STORAGE_KEY = "dm_quicklinks";
const DEFAULT_LINKS: QuickLink[] = [
  { id: "1", label: "GitHub", url: "https://github.com", emoji: "🐙" },
  { id: "2", label: "Gmail", url: "https://mail.google.com", emoji: "📧" },
  { id: "3", label: "YouTube", url: "https://youtube.com", emoji: "▶️" }
];

const getFaviconUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return null;
  }
};

function QuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_LINKS;

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return DEFAULT_LINKS;

      const normalized = parsed.reduce<QuickLink[]>((acc, item) => {
        if (typeof item !== "object" || item === null) return acc;
        const candidate = item as Record<string, unknown>;
        if (
          typeof candidate.id === "string" &&
          typeof candidate.label === "string" &&
          typeof candidate.url === "string" &&
          typeof candidate.emoji === "string"
        ) {
          acc.push({
            id: candidate.id,
            label: candidate.label,
            url: candidate.url,
            emoji: candidate.emoji
          });
        }
        return acc;
      }, []);

      return normalized.length > 0 ? normalized : DEFAULT_LINKS;
    } catch {
      return DEFAULT_LINKS;
    }
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newLabel, setNewLabel] = useState<string>("");
  const [newUrl, setNewUrl] = useState<string>("");
  const [newEmoji, setNewEmoji] = useState<string>("🔗");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [brokenFavicons, setBrokenFavicons] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }, [links]);

  const faviconUrls = useMemo(() => {
    return links.reduce<Record<string, string | null>>((acc, link) => {
      acc[link.id] = getFaviconUrl(link.url);
      return acc;
    }, {});
  }, [links]);

  const addLink = () => {
    const label = newLabel.trim();
    const rawUrl = newUrl.trim();
    if (!label || !rawUrl) return;

    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    const link: QuickLink = {
      id: crypto.randomUUID(),
      label,
      url,
      emoji: newEmoji.trim() || "🔗"
    };

    setLinks((prev) => [...prev, link]);
    setNewLabel("");
    setNewUrl("");
    setNewEmoji("??");
  };

  const removeLink = (id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
    setBrokenFavicons((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const openLink = (url: string) => {
    void window.electronAPI?.openExternal?.(url);
  };

  const reorderLinks = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setLinks((prev) => {
      const fromIndex = prev.findIndex((l) => l.id === fromId);
      const toIndex = prev.findIndex((l) => l.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <section className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.12em] text-white/35">Szybkie linki</h2>
        <button onClick={() => setIsEditing((e) => !e)} className="text-[10px] text-white/30 transition-all hover:text-white/60">
          {isEditing ? "Gotowe" : "Edytuj"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {links.map((link) => {
          const faviconUrl = faviconUrls[link.id];
          const showFavicon = Boolean(faviconUrl) && !brokenFavicons[link.id];

          return (
            <div
              key={link.id}
              className="group/link relative"
              draggable={isEditing}
              onDragStart={() => setDraggedId(link.id)}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(e) => {
                if (!isEditing) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!isEditing || !draggedId) return;
                e.preventDefault();
                reorderLinks(draggedId, link.id);
                setDraggedId(null);
              }}
            >
              <button
                onClick={() => openLink(link.url)}
                className={`w-full flex flex-col items-center gap-1 rounded-xl border border-white/8 bg-white/5 px-2 py-3 transition-all hover:border-white/15 hover:bg-white/10 ${isEditing ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                {isEditing && (
                  <span className="absolute left-1.5 top-1 text-[9px] leading-none text-white/25" aria-hidden="true">
                    ⠿
                  </span>
                )}
                {showFavicon ? (
                  <img
                    src={faviconUrl ?? undefined}
                    alt=""
                    className="h-5 w-5 rounded-sm"
                    onError={() => setBrokenFavicons((prev) => ({ ...prev, [link.id]: true }))}
                  />
                ) : (
                  <span className="text-xl leading-none">{link.emoji}</span>
                )}
                <span className="w-full truncate text-center text-[10px] text-white/50">{link.label}</span>
              </button>
              {isEditing && (
                <button
                  onClick={() => removeLink(link.id)}
                  className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/70 text-[10px] text-white transition-all hover:bg-red-500"
                  aria-label="Usuń link"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addLink();
              }}
              className="mt-3 space-y-1.5"
            >
              <div className="flex gap-1.5">
                <input
                  placeholder="Emoji"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  className="w-12 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm outline-none transition-all focus:border-violet-500/40"
                  maxLength={2}
                />
                <input
                  placeholder="Nazwa"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/70 outline-none placeholder:text-white/25 transition-all focus:border-violet-500/40"
                />
              </div>
              <div className="flex gap-1.5">
                <input
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/70 outline-none placeholder:text-white/25 transition-all focus:border-violet-500/40"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-violet-500/30 bg-violet-500/20 px-3 text-xs text-violet-200 transition-all hover:bg-violet-500/30"
                >
                  +
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default QuickLinks;
