"use client";
/**
 * HighlightsEditor
 * ────────────────
 * Admin-side editor for the product highlights array (bullet points).
 *
 * • Add / remove highlight lines
 * • Empty-string prevention
 * • Controlled: parent passes `value` + `onChange`
 */

import { useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface Props {
  value:    string[];
  onChange: (val: string[]) => void;
}

const MAX_HIGHLIGHTS = 20;

export default function HighlightsEditor({ value, onChange }: Props) {
  const [localError, setLocalError] = useState<string | null>(null);

  const update = (idx: number, text: string) => {
    setLocalError(null);
    const next = value.map((h, i) => (i === idx ? text : h));
    onChange(next);
  };

  const add = () => {
    if (value.length >= MAX_HIGHLIGHTS) return;
    onChange([...value, ""]);
  };

  const remove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    setLocalError(null);
  };

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <p className="text-sm text-gray-400 py-2 border-2 border-dashed border-gray-200 rounded-xl text-center">
          No highlights yet. Click "Add Highlight" below.
        </p>
      )}

      {value.map((h, i) => {
        const isEmpty = h.trim() === "";
        return (
          <div key={i} className="flex items-start gap-2 group/hl">
            {/* bullet */}
            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
            <div className="flex-1">
              <input
                type="text"
                value={h}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`Highlight ${i + 1} (e.g. Lightweight 85g frame)`}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all
                  ${isEmpty
                    ? "border-amber-300 focus:ring-amber-200 bg-amber-50/40"
                    : "border-gray-200 focus:ring-brand-300 focus:border-brand-400"
                  }`}
              />
              {isEmpty && (
                <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                  <AlertCircle size={11} /> This highlight is empty and will be ignored on save.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="mt-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/hl:opacity-100"
              title="Remove highlight"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}

      {value.length < MAX_HIGHLIGHTS ? (
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700
            font-semibold mt-1 transition-colors"
        >
          <Plus size={12} /> Add Highlight
        </button>
      ) : (
        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
          <AlertCircle size={11} /> Max {MAX_HIGHLIGHTS} highlights reached.
        </p>
      )}
    </div>
  );
}
