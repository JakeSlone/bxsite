"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Editor from "@/components/Editor";
import {
  getVerificationTxtHost,
  getVerificationTxtValue,
} from "@/lib/domain-verification-helpers";

type DashboardClientProps = {
  initialSlug?: string;
  initialMarkdown?: string;
  mySlugs: string[];
  initialCustomDomain?: string;
  initialDomainVerified?: boolean;
  initialDomainVerificationToken?: string;
};

export default function DashboardClient({
  initialSlug = "",
  initialMarkdown = "",
  mySlugs,
  initialCustomDomain,
  initialDomainVerified,
  initialDomainVerificationToken,
}: DashboardClientProps) {
  const [slug, setSlug] = useState(initialSlug);
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [customDomain, setCustomDomain] = useState(initialCustomDomain || "");
  const [domainVerified, setDomainVerified] = useState(
    initialDomainVerified || false
  );
  const [domainVerificationToken, setDomainVerificationToken] = useState(
    initialDomainVerificationToken
  );
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingSlug, setLoadingSlug] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [slugs, setSlugs] = useState<string[]>(mySlugs);

  useEffect(() => {
    setSlug(initialSlug);
    setMarkdown(initialMarkdown);
    setCustomDomain(initialCustomDomain || "");
    setDomainVerified(initialDomainVerified || false);
    setDomainVerificationToken(initialDomainVerificationToken);
  }, [
    initialSlug,
    initialMarkdown,
    initialCustomDomain,
    initialDomainVerified,
    initialDomainVerificationToken,
  ]);

  useEffect(() => {
    setSlugs(mySlugs);
  }, [mySlugs]);

  const trimmedSlug = useMemo(() => slug.trim().toLowerCase(), [slug]);

  const handleSave = () => {
    if (!trimmedSlug) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const payload: any = {
          slug: trimmedSlug,
          markdown,
        };
        if (customDomain.trim()) {
          payload.customDomain = customDomain.trim();
        }

        const resp = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await resp.json().catch(() => ({}));
        if (resp.ok) {
          setMessage("Saved!");
          setSlugs((prev) =>
            prev.includes(trimmedSlug) ? prev : [...prev, trimmedSlug].sort()
          );
          if (data.domainVerificationToken) {
            setDomainVerificationToken(data.domainVerificationToken);
            setDomainVerified(data.domainVerified || false);
          }
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
        setCustomDomain(data.customDomain || "");
        setDomainVerified(data.domainVerified || false);
        setDomainVerificationToken(data.domainVerificationToken);
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

  const handleVerifyDomain = async () => {
    if (!trimmedSlug || !customDomain.trim()) return;
    setVerifyingDomain(true);
    setMessage(null);
    try {
      const resp = await fetch(
        `/api/sites/${encodeURIComponent(trimmedSlug)}/verify-domain`,
        {
          method: "POST",
        }
      );
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data.verified) {
        setDomainVerified(true);
        setMessage("Domain verified successfully!");
      } else {
        setMessage(data?.error || "Domain verification failed");
      }
    } catch {
      setMessage("Network error during verification");
    } finally {
      setVerifyingDomain(false);
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
      <div className="space-y-3">
        <label className="block text-sm text-slate-300">
          Custom Domain (optional)
        </label>
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-slate-100 placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
          placeholder="example.com"
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
        />
        {customDomain.trim() && domainVerificationToken && (
          <div className="space-y-2 rounded border border-slate-700 bg-slate-900 p-3 text-xs">
            <p className="text-slate-300 font-semibold">DNS Configuration:</p>
            <p className="text-slate-400">
              Add a TXT record to your DNS settings:
            </p>
            <div className="rounded bg-slate-800 p-2 font-mono text-slate-200 break-all">
              <div className="text-sky-300">Name/Host:</div>@
              <div className="text-sky-300 mt-2">Type:</div>
              <div>TXT</div>
              <div className="text-sky-300 mt-2">Value:</div>
              <div>{getVerificationTxtValue(domainVerificationToken)}</div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleVerifyDomain}
                disabled={verifyingDomain || !trimmedSlug}
                className="rounded border border-sky-300 px-3 py-1 text-sky-300 text-xs disabled:opacity-50 hover:bg-sky-300/10 transition-colors"
              >
                {verifyingDomain ? "Verifying..." : "Verify Domain"}
              </button>
              {domainVerified && (
                <span className="text-green-400 text-xs">✓ Verified</span>
              )}
            </div>
            {domainVerified && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-slate-300 font-semibold mb-2">
                  Point Domain to bxsite:
                </p>
                <p className="text-slate-400 text-xs mb-2">
                  Add this DNS record to point your domain to bxsite:
                </p>
                <div className="rounded bg-slate-800 p-2 font-mono text-slate-200 break-all text-xs">
                  <div className="text-slate-400">Name/Host:</div>
                  <div>@</div>
                  <div className="text-slate-400 mt-2">Type:</div>
                  <div>ALIAS or ANAME</div>
                  <div className="text-slate-400 mt-2">Value:</div>
                  <div>bxsite.com</div>
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  After adding the DNS record, wait 5-10 minutes for
                  propagation. Your site will be available at{" "}
                  <span className="text-sky-300">
                    https://{customDomain.trim()}
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
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
            href={
              customDomain.trim() && domainVerified
                ? `https://${customDomain.trim()}`
                : `https://${trimmedSlug}.bxsite.com`
            }
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
