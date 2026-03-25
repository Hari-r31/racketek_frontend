"use client";
/**
 * SpecificationBuilder
 *
 * Dynamic admin-controlled specification builder.
 *
 * Features:
 *  - Add / rename / delete sections
 *  - Add / edit key+value / delete fields inside each section
 *  - Inline validation (empty key, invalid value type)
 *  - Drag-to-reorder sections (via HTML5 drag-and-drop)
 *  - Produces a plain Dict[str, Dict[str, scalar]] compatible with the
 *    backend validation contract.
 *
 * Usage:
 *   <SpecificationBuilder value={specs} onChange={setSpecs} />
 *
 * where `specs` is:
 *   { "General": { "Brand": "Yonex" }, "Dimensions": { "Weight": "85g" } }
 */

import { useState, useRef, useCallback } from "react";
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronUp, AlertCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SpecValue    = string | number | boolean;
export type SpecSection  = Record<string, SpecValue>;
export type Specifications = Record<string, SpecSection>;

interface FieldRow {
  key:   string;
  value: string; // always edited as string; parsed on export
}

interface SectionState {
  id:        string;   // internal stable id
  name:      string;   // displayed / exported as section key
  fields:    FieldRow[];
  collapsed: boolean;
  nameError: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_SECTIONS       = 50;
const MAX_FIELDS_PER_SEC = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let _idCounter = 0;
function uid() { return `sec-${Date.now()}-${++_idCounter}`; }

/** Parse a string into the most specific scalar. */
function parseValue(raw: string): SpecValue {
  const trimmed = raw.trim();
  if (trimmed === "true")  return true;
  if (trimmed === "false") return false;
  const num = Number(trimmed);
  if (trimmed !== "" && !Number.isNaN(num)) return num;
  return raw; // keep as string (including empty)
}

/** Convert internal state → Specifications dict. */
function sectionsToSpecs(sections: SectionState[]): Specifications {
  const out: Specifications = {};
  for (const sec of sections) {
    if (!sec.name.trim()) continue;
    const fields: SpecSection = {};
    for (const f of sec.fields) {
      if (!f.key.trim()) continue;
      fields[f.key.trim()] = parseValue(f.value);
    }
    out[sec.name.trim()] = fields;
  }
  return out;
}

/** Convert Specifications dict → internal state. */
function specsToSections(specs: Specifications | null | undefined): SectionState[] {
  if (!specs || typeof specs !== "object") return [];
  return Object.entries(specs).map(([name, fields]) => ({
    id: uid(),
    name,
    fields: Object.entries(fields || {}).map(([key, value]) => ({
      key,
      value: String(value),
    })),
    collapsed: false,
    nameError: "",
  }));
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
function validateFieldKey(key: string): string {
  if (!key.trim()) return "Key cannot be empty";
  return "";
}

function validateSectionName(name: string, sections: SectionState[], selfId: string): string {
  if (!name.trim()) return "Section name cannot be empty";
  const dup = sections.find(s => s.id !== selfId && s.name.trim() === name.trim());
  if (dup) return "Duplicate section name";
  return "";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FieldRowProps {
  field:     FieldRow;
  fieldIdx:  number;
  onChange:  (idx: number, patch: Partial<FieldRow>) => void;
  onRemove:  (idx: number) => void;
}

function FieldRowItem({ field, fieldIdx, onChange, onRemove }: FieldRowProps) {
  const keyError = validateFieldKey(field.key);

  return (
    <div className="grid grid-cols-[1fr_1fr_32px] gap-2 items-start">
      {/* Key */}
      <div>
        <input
          type="text"
          value={field.key}
          onChange={e => onChange(fieldIdx, { key: e.target.value })}
          placeholder="e.g. Brand"
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
        value={field.value}
        onChange={e => onChange(fieldIdx, { value: e.target.value })}
        placeholder="e.g. Yonex"
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
      />

      {/* Delete field */}
      <button
        type="button"
        onClick={() => onRemove(fieldIdx)}
        className="h-[38px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
        title="Remove field"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SpecificationBuilderProps {
  value?:    Specifications | null;
  onChange?: (specs: Specifications) => void;
  disabled?: boolean;
}

export default function SpecificationBuilder({
  value,
  onChange,
  disabled = false,
}: SpecificationBuilderProps) {
  const [sections, setSections] = useState<SectionState[]>(() =>
    specsToSections(value)
  );

  // Drag state
  const dragIdxRef  = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  // ── emit ──────────────────────────────────────────────────────────────────
  const emit = useCallback((next: SectionState[]) => {
    setSections(next);
    onChange?.(sectionsToSpecs(next));
  }, [onChange]);

  // ── Section operations ────────────────────────────────────────────────────
  const addSection = () => {
    if (sections.length >= MAX_SECTIONS) return;
    emit([
      ...sections,
      { id: uid(), name: "", fields: [], collapsed: false, nameError: "" },
    ]);
  };

  const updateSectionName = (idx: number, name: string) => {
    const next = sections.map((s, i) => {
      if (i !== idx) return s;
      const nameError = validateSectionName(name, sections, s.id);
      return { ...s, name, nameError };
    });
    emit(next);
  };

  const deleteSection = (idx: number) => {
    emit(sections.filter((_, i) => i !== idx));
  };

  const toggleCollapse = (idx: number) => {
    emit(sections.map((s, i) => i === idx ? { ...s, collapsed: !s.collapsed } : s));
  };

  // ── Field operations ───────────────────────────────────────────────────────
  const addField = (secIdx: number) => {
    if (sections[secIdx].fields.length >= MAX_FIELDS_PER_SEC) return;
    const next = sections.map((s, i) =>
      i === secIdx
        ? { ...s, fields: [...s.fields, { key: "", value: "" }] }
        : s
    );
    emit(next);
  };

  const updateField = (secIdx: number, fIdx: number, patch: Partial<FieldRow>) => {
    const next = sections.map((s, i) =>
      i === secIdx
        ? { ...s, fields: s.fields.map((f, fi) => fi === fIdx ? { ...f, ...patch } : f) }
        : s
    );
    emit(next);
  };

  const deleteField = (secIdx: number, fIdx: number) => {
    const next = sections.map((s, i) =>
      i === secIdx
        ? { ...s, fields: s.fields.filter((_, fi) => fi !== fIdx) }
        : s
    );
    emit(next);
  };

  // ── Drag-to-reorder sections ───────────────────────────────────────────────
  const onDragStart = (idx: number) => { dragIdxRef.current = idx; };
  const onDragEnter = (idx: number) => { dragOverRef.current = idx; };
  const onDragEnd   = () => {
    const from = dragIdxRef.current;
    const to   = dragOverRef.current;
    if (from === null || to === null || from === to) return;
    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    dragIdxRef.current  = null;
    dragOverRef.current = null;
    emit(next);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {sections.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
          No specification sections yet. Click &ldquo;Add Section&rdquo; to start.
        </div>
      )}

      {sections.map((sec, secIdx) => (
        <div
          key={sec.id}
          draggable={!disabled}
          onDragStart={() => onDragStart(secIdx)}
          onDragEnter={() => onDragEnter(secIdx)}
          onDragEnd={onDragEnd}
          onDragOver={e => e.preventDefault()}
          className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"
        >
          {/* Section header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            {/* Drag handle */}
            {!disabled && (
              <GripVertical
                size={15}
                className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
              />
            )}

            {/* Section name input */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={sec.name}
                onChange={e => updateSectionName(secIdx, e.target.value)}
                placeholder="Section name (e.g. General)"
                disabled={disabled}
                className={`w-full text-sm font-semibold bg-transparent border-0 border-b focus:outline-none py-0.5 transition-all
                  ${sec.nameError
                    ? "border-red-400 text-red-700 placeholder-red-300"
                    : "border-transparent focus:border-brand-400 text-gray-900 placeholder-gray-400"
                  }`}
              />
              {sec.nameError && (
                <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle size={10} /> {sec.nameError}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Collapse toggle */}
              <button
                type="button"
                onClick={() => toggleCollapse(secIdx)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                title={sec.collapsed ? "Expand" : "Collapse"}
              >
                {sec.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              {/* Delete section */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => deleteSection(secIdx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  title="Delete section"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Fields area */}
          {!sec.collapsed && (
            <div className="p-4 space-y-2.5">
              {/* Column headers */}
              {sec.fields.length > 0 && (
                <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-0.5">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Key</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Value</p>
                </div>
              )}

              {sec.fields.map((field, fIdx) => (
                <FieldRowItem
                  key={fIdx}
                  field={field}
                  fieldIdx={fIdx}
                  onChange={(fi, patch) => updateField(secIdx, fi, patch)}
                  onRemove={fi => deleteField(secIdx, fi)}
                />
              ))}

              {sec.fields.length === 0 && (
                <p className="text-xs text-gray-400 py-1">
                  No fields yet — click &ldquo;Add Field&rdquo; below.
                </p>
              )}

              {/* Add field button */}
              {!disabled && sec.fields.length < MAX_FIELDS_PER_SEC && (
                <button
                  type="button"
                  onClick={() => addField(secIdx)}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold mt-1 transition-colors"
                >
                  <Plus size={13} /> Add Field
                </button>
              )}
              {sec.fields.length >= MAX_FIELDS_PER_SEC && (
                <p className="text-xs text-amber-600">
                  Maximum {MAX_FIELDS_PER_SEC} fields per section reached.
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add section */}
      {!disabled && sections.length < MAX_SECTIONS && (
        <button
          type="button"
          onClick={addSection}
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-semibold border-2 border-dashed border-brand-200 hover:border-brand-400 rounded-xl px-4 py-3 w-full justify-center transition-all hover:bg-brand-50"
        >
          <Plus size={15} /> Add Section
        </button>
      )}
      {sections.length >= MAX_SECTIONS && (
        <p className="text-xs text-amber-600 text-center">
          Maximum {MAX_SECTIONS} sections reached.
        </p>
      )}
    </div>
  );
}
