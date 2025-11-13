"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Editor from "@/components/Editor";

type DashboardClientProps = {
  initialSlug?: string;
  initialMarkdown?: string;
  mySlugs: string[];
};

export default function DashboardClient({
  initialSlug = "",
  initialMarkdown = "",
  mySlugs,
}: DashboardClientProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingSlug, setLoadingSlug] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [slugs, setSlugs] = useState<string[]>(mySlugs);

  useEffect(() => {
    setSlug(initialSlug);
    setMarkdown(initialMarkdown);
  }, [initialSlug, initialMarkdown]);

  useEffect(() => {
    setSlugs(mySlugs);
  }, [mySlugs]);

  const trimmedSlug = useMemo(() => slug.trim().toLowerCase(), [slug]);

  const handleSave = () => {
    if (!trimmedSlug) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const resp = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: trimmedSlug, markdown }),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) {
          setMessage("Saved!");
          setSlugs((prev) =>
            prev.includes(trimmedSlug) ? prev : [...prev, trimmedSlug].sort()
          );
        } else {
          setMessage(data?.error || "Failed to save");
        }
      } catch {
        setMessage("Network error");
      }
    });
  };

  const loadSlug = async (slugToLoad: string) => {
    setLoadingSlug(true);
    setMessage(null);
    try {
      const resp = await fetch(`/api/sites/${encodeURIComponent(slugToLoad)}`);
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setSlug(data.slug);
        setMarkdown(data.markdown);
        setMessage(`Loaded ${data.slug}`);
      } else {
        setMessage(data?.error || "Unable to load site");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoadingSlug(false);
    }
  };

  const handleDelete = async () => {
    if (!trimmedSlug) return;
    if (
      !window.confirm(
        `Delete ${trimmedSlug}.bxsite.com? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeletePending(true);
    setMessage(null);
    try {
      const resp = await fetch(
        `/api/sites/${encodeURIComponent(trimmedSlug)}`,
        {
          method: "DELETE",
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (resp.ok) {
        setSlugs((prev) => prev.filter((s) => s !== trimmedSlug));
        setSlug("");
        setMarkdown("");
        setMessage(`Deleted ${trimmedSlug}`);
      } else {
        setMessage(data?.error || "Failed to delete");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setDeletePending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Your bxsite</h1>
      </div>
      {slugs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slugs.map((mySlug) => {
            const isActive = mySlug === trimmedSlug;
            return (
              <button
                key={mySlug}
                type="button"
                onClick={() => loadSlug(mySlug)}
                className={`rounded border px-3 py-1 text-sm transition ${
                  isActive
                    ? "border-transparent bg-sky-300 text-slate-950"
                    : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                }`}
                disabled={loadingSlug || deletePending}
              >
                {mySlug}
              </button>
            );
          })}
        </div>
      )}
      {slugs.length === 0 && (
        <p className="text-sm text-slate-400">
          No sites yet — create your first one below.
        </p>
      )}
      <div className="space-y-3">
        <label className="block text-sm text-slate-300">Subdomain (slug)</label>
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
          placeholder="my-site"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <p className="text-xs text-slate-400">
          Your site will be available at https://{trimmedSlug || "your-slug"}
          .bxsite.com. The page title will be generated from this slug.
        </p>
      </div>
      <Editor value={markdown} onChange={setMarkdown} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !trimmedSlug}
          className="rounded bg-sky-300 px-4 py-2 text-slate-950 font-medium disabled:opacity-50 hover:bg-sky-200 transition-colors"
        >
          {isPending ? "Saving..." : "Save & Deploy"}
        </button>
        {trimmedSlug && (
          <a
            className="text-sm text-sky-300 underline underline-offset-4 hover:text-sky-200"
            href={`https://${trimmedSlug}.bxsite.com`}
            target="_blank"
            rel="noreferrer"
          >
            View live
          </a>
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={
            deletePending || !trimmedSlug || !slugs.includes(trimmedSlug)
          }
          className="ml-auto rounded border border-red-500 px-4 py-2 text-red-500 disabled:opacity-50 hover:bg-red-500/10 transition-colors"
        >
          {deletePending ? "Deleting..." : "Delete"}
        </button>
      </div>
      {message && (
        <p
          className={`text-sm ${
            message.includes("Saved") ||
            message.includes("Loaded") ||
            message.includes("Deleted")
              ? "text-sky-300"
              : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
