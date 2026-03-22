"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, FileText } from "lucide-react";

type MappingObject = Record<string, string>;

function serializeMapping(mapping: MappingObject | null | undefined): string {
  if (!mapping) return "";
  return Object.entries(mapping)
    .map(([k, v]) => `${k}=${v};`)
    .join("\n");
}

function parseMapping(input: string): MappingObject {
  const result: MappingObject = {};
  const parts = input.split(/[\n;]+/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [rawKey, rawVal] = trimmed.split("=");
    if (!rawKey || !rawVal) continue;
    const key = rawKey.trim();
    const val = rawVal.trim();
    if (!key || !val) continue;
    result[key] = val;
  }
  return result;
}

export function NamingTab() {
  const { data: session } = useSession();
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initial = (session?.user as any)?.filenameMapping as MappingObject | undefined;
    if (initial && !rawText) {
      setRawText(serializeMapping(initial));
    } else if (!initial && !rawText) {
      setLoading(true);
      fetch("/api/filename-mapping")
        .then((res) => res.json())
        .then((data) => {
          if (data?.data) {
            setRawText(serializeMapping(data.data));
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [session, rawText]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const mapping = parseMapping(rawText);
      const res = await fetch("/api/filename-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mapping }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save mapping");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 w-full min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">Filename Mapping</h1>
        <p className="text-slate-500">
          Map the last 4 card digits to a filename prefix. The prefix will be placed in front of the original file name.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        {saved && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold">
              ✓
            </span>
            <span>Filename rules saved successfully</span>
          </div>
        )}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Rules</p>
            <p className="text-sm text-slate-400">
              One rule per line. Example: <span className="font-mono">5991=WF-0004-1;</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
          placeholder={`5991=WF-0004-1;\n5821=WF-0004-2;\n9649=WF-0004-9;`}
        />

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <p className="text-xs text-slate-400 min-w-0 flex-1">
            When an invoice has card last 4 digits <span className="font-mono">5991</span>, the uploaded file will be named
            <span className="font-mono"> WF-0004-1 &lt;original-filename&gt;</span>.
          </p>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl landing-accent-bg text-white text-sm font-medium hover:opacity-95 disabled:opacity-50 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed shrink-0 whitespace-nowrap ml-auto"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
            <span>{saved ? "Saved" : "Save Rules"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

