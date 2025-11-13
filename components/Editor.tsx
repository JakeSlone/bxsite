"use client";

import { useState } from "react";
import Markdown from "./Markdown";

type EditorProps = {
  value: string;
  onChange: (next: string) => void;
};

export default function Editor({ value, onChange }: EditorProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-slate-400">Markdown</span>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-colors"
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="prose prose-invert max-w-none rounded border border-slate-700 bg-slate-900 p-4 text-slate-100">
          {value.trim().length === 0 ? (
            <p className="text-sm text-slate-400">
              _Nothing to preview yet..._
            </p>
          ) : (
            <Markdown>{value}</Markdown>
          )}
        </div>
      ) : (
        <textarea
          className="min-h-[300px] w-full rounded border border-slate-700 bg-slate-900 p-3 font-mono text-slate-100 placeholder:text-slate-500 focus:border-sky-300 focus:outline-none"
          placeholder="# Hello bxsite"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
