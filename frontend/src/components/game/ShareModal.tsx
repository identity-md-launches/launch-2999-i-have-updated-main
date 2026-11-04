import { useState } from "react";
import { Check, Copy, Link2, Send, X } from "lucide-react";
import { PIXEL, VN, btnGhost, btnGold, panelClass } from "./ui";
import { SHORT_POST, THREAD_POSTS, copyText, gameUrl, postOnX } from "@/lib/share";

/**
 * One-click promo panel: ready-written English copy for X, plus a copy button
 * for people who want to post it somewhere else.
 */
export function ShareModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"single" | "thread">("single");
  const [copied, setCopied] = useState<string | null>(null);
  const url = gameUrl();

  const flash = (id: string) => {
    setCopied(id);
    window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1600);
  };

  const copy = async (id: string, text: string) => {
    if (await copyText(text)) flash(id);
  };

  const threadAll = THREAD_POSTS.map((post, i) => `${i + 1}/${THREAD_POSTS.length} ${post}`).join("\n\n");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className={`${panelClass} flex max-h-[88vh] w-full max-w-[560px] flex-col`}>
        <div className="flex items-center justify-between border-b-2 border-[#37305a] px-5 py-3">
          <div className="flex items-center gap-2">
            <Send size={15} className="text-[#ffd977]" />
            <h2 className="text-[12px] text-[#ffd977]" style={PIXEL}>
              SHARE SQUEEK LIFE
            </h2>
          </div>
          <button type="button" className={btnGhost} onClick={onClose} aria-label="Close" style={VN}>
            <X size={13} />
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-4">
          <button
            type="button"
            className={tab === "single" ? btnGold : btnGhost}
            onClick={() => setTab("single")}
            style={VN}
          >
            Single post
          </button>
          <button
            type="button"
            className={tab === "thread" ? btnGold : btnGhost}
            onClick={() => setTab("thread")}
            style={VN}
          >
            Thread · {THREAD_POSTS.length} posts
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {tab === "single" ? (
            <div className="rounded-md border-2 border-[#241f33] bg-[#191527] p-3">
              <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#f2f0fa]" style={VN}>
                {SHORT_POST}
              </p>
              <p className="mt-2 text-[11px] text-[#8f88b5]" style={VN}>
                {url}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {THREAD_POSTS.map((post, i) => (
                <div key={i} className="rounded-md border-2 border-[#241f33] bg-[#191527] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] text-[#8f88b5]" style={PIXEL}>
                      {i + 1}/{THREAD_POSTS.length}
                    </span>
                    <button type="button" className={btnGhost} onClick={() => void copy(`p${i}`, post)} style={VN}>
                      {copied === `p${i}` ? <Check size={12} /> : <Copy size={12} />}
                      {copied === `p${i}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#f2f0fa]" style={VN}>
                    {post}
                  </p>
                </div>
              ))}
              <p className="text-[11px] text-[#8f88b5]" style={VN}>
                Post these one after another to build the thread. The link goes on the last one.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#37305a] px-5 py-4">
          <button
            type="button"
            className={btnGhost}
            onClick={() => void copy("link", url)}
            style={VN}
          >
            {copied === "link" ? <Check size={12} /> : <Link2 size={12} />}
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              className={btnGhost}
              onClick={() => void copy("all", tab === "single" ? `${SHORT_POST}\n\n${url}` : `${threadAll}\n\n${url}`)}
              style={VN}
            >
              {copied === "all" ? <Check size={12} /> : <Copy size={12} />}
              {copied === "all" ? "Copied" : "Copy text"}
            </button>
            <button
              type="button"
              className={btnGold}
              onClick={() => postOnX(tab === "single" ? SHORT_POST : THREAD_POSTS[0], url)}
              style={VN}
            >
              <Send size={12} /> Post on X
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
