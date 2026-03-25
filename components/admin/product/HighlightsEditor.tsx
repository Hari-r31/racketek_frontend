"use client";
/**
 * HighlightsEditor
 *
 * Simple bullet-point editor for product highlights.
 * Produces a List[str] for the backend.
 *
 * Usage:
 *   <HighlightsEditor value={highlights} onChange={setHighlights} />
 */

import { Plus, Trash2, GripVertical } from "lucide-react";
import { useRef } from "react";

const MAX_ITEMS   = 100;
const MAX_LEN     = 500;

interface HighlightsEditorProps {
  value?:    string[];
  onChange?: (items: string[]) => void;
  disabled?: boolean;
}

let _hid = 0;
function huid() { return ++_hid; }

export default function HighlightsEditor({
  value    = [],
  onChange,
  disabled = false,
}: HighlightsEditorProps) {
  const dragIdx  = useRef<number | null>(null);
  const overIdx  = useRef<number | null>(null);

  const emit = (next: string[]) => onChange?.(next);

  const update = (idx: number, text: string) => {
    const next = [...value];
    next[idx]  = text;
    emit(next);
  };

  const addItem = () => {
    if (value.length >= MAX_ITEMS) return;
    emit([...value, ""]);
  };

  const removeItem = (idx: number) => {
    emit(value.filter((_, i) => i !== idx));
  };

  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragEnter = (idx: number) => { overIdx.current = idx; };
  const onDragEnd   = () => {
    const from = dragIdx.current;
    const to   = overIdx.current;
    if (from === null || to === null || from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    dragIdx.current = null;
    overIdx.current = null;
    emit(next);
  };

  return (
    <div className="space-y-2">
      {value.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
          No highlights yet. Click &ldquo;Add Highlight&rdquo; to add bullet points.
        </div>
      )}

      {value.map((item, idx) => (
        <div
          key={idx}
          draggable={!disabled}
          onDragStart={() => onDragStart(idx)}
          onDragEnter={() => onDragEnter(idx)}
          onDragEnd={onDragEnd}
          onDragOver={e => e.preventDefault()}
          className="flex items-start gap-2"
        >
          {/* Drag handle */}
          {!disabled && (
            <GripVertical
              size={14}
              className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing mt-2.5 shrink-0"
            />
          )}

          {/* Bullet indicator */}
          <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />

          {/* Input */}
          <div className="flex-1">
            <input
              type="text"
              value={item}
              maxLength={MAX_LEN}
              disabled={disabled}
              onChange={e => update(idx, e.target.value)}
              placeholder={`Highlight ${idx + 1}`}
              className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all
                ${!item.trim()
                  ? "border-amber-300 bg-amber-50/30"
                  : "border-gray-300 bg-white"
                }`}
            />
            {!item.trim() && (
              <p className="text-[11px] text-amber-500 mt-0.5">Highlight text cannot be empty</p>
            )}
          </div>

          {/* Delete */}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="mt-2 p-1 text-gray-400 hover:text-red-500 transition-colors rounded-lg"
              title="Remove highlight"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}

      {!disabled && value.length < MAX_ITEMS && (
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-semibold border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-xl px-4 py-2.5 w-full justify-center transition-all hover:bg-brand-50 mt-1"
        >
          <Plus size={14} /> Add Highlight
        </button>
      )}
    </div>
  );
}
