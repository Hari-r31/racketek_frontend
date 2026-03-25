"use client";
/**
 * ManufacturerInfoEditor
 *
 * Simple key-value editor for manufacturer / compliance info.
 * Produces a flat Dict[str, scalar] for the backend.
 *
 * Usage:
 *   <ManufacturerInfoEditor value={mfrInfo} onChange={setMfrInfo} />
 */

import { Plus, Trash2, AlertCircle } from "lucide-react";
import { ManufacturerInfo } from "@/types";

interface RowState {
  key:   string;
  value: string;
}

interface ManufacturerInfoEditorProps {
  value?:    ManufacturerInfo | null;
  onChange?: (info: ManufacturerInfo) => void;
  disabled?: boolean;
}

function rowsToInfo(rows: RowState[]): ManufacturerInfo {
  const out: ManufacturerInfo = {};
  for (const row of rows) {
    if (row.key.trim()) {
      out[row.key.trim()] = row.value;
    }
  }
  return out;
}

function infoToRows(info: ManufacturerInfo | null | undefined): RowState[] {
  if (!info || typeof info !== "object") return [];
  return Object.entries(info).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

// Preset common keys for quick insertion
const PRESETS = [
  "Manufacturer",
  "Country of Origin",
  "FSSAI License",
  "Customer Care",
  "Net Quantity",
  "Marketed By",
];

export default function ManufacturerInfoEditor({
  value,
  onChange,
  disabled = false,
}: ManufacturerInfoEditorProps) {
  // We manage rows as local state derived from value prop
  // (controlled — parent owns truth)
  const rows = infoToRows(value);

  const emit = (next: RowState[]) => onChange?.(rowsToInfo(next));

  const addRow = (preset?: string) => {
    emit([...rows, { key: preset ?? "", value: "" }]);
  };

  const updateRow = (idx: number, patch: Partial<RowState>) => {
    emit(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const deleteRow = (idx: number) => {
    emit(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Preset quick-add chips */}
      {!disabled && (
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.filter(p => !rows.some(r => r.key === p)).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => addRow(p)}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-brand-200 text-brand-600 hover:bg-brand-50 hover:border-brand-400 transition-all"
            >
              + {p}
            </button>
          ))}
        </div>
      )}

      {rows.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
          No information added yet.
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-2">
          {/* Headers */}
          <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-0.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Field</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Value</p>
          </div>

          {rows.map((row, idx) => {
            const keyError = !row.key.trim() ? "Field name required" : "";
            return (
              <div key={idx} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-start">
                {/* Key */}
                <div>
                  <input
                    type="text"
                    value={row.key}
                    disabled={disabled}
                    onChange={e => updateRow(idx, { key: e.target.value })}
                    placeholder="e.g. Manufacturer"
                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 transition-all
                      ${keyError
                        ? "border-red-400 focus:ring-red-400/20"
                        : "border-gray-300 focus:border-brand-500 focus:ring-brand-500/10"
                      }`}
                  />
                  {keyError && (
                    <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
                      <AlertCircle size={10} /> {keyError}
                    </p>
                  )}
                </div>
                {/* Value */}
                <input
                  type="text"
                  value={row.value}
                  disabled={disabled}
                  onChange={e => updateRow(idx, { value: e.target.value })}
                  placeholder="e.g. Yonex Co. Ltd"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                />
                {/* Delete */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => deleteRow(idx)}
                    className="h-[38px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!disabled && (
        <button
          type="button"
          onClick={() => addRow()}
          className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-semibold border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-xl px-4 py-2.5 w-full justify-center transition-all hover:bg-brand-50"
        >
          <Plus size={14} /> Add Field
        </button>
      )}
    </div>
  );
}
