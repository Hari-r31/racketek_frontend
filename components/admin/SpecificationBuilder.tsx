"use client";
/**
 * SpecificationBuilder
 * ────────────────────
 * Admin-side dynamic specification editor.
 *
 * Data model (matches backend):
 *   specifications: Record<string, Record<string, string | number | boolean>>
 *
 * Features
 * ─────────
 * • Add / delete sections
 * • Add / delete fields within a section
 * • Edit key and value inline
 * • Inline validation (empty keys, empty values, too many sections/fields)
 * • Drag-and-drop section reordering (via mouse-drag handle)
 * • Controlled: parent passes `value` + `onChange`
 */

import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
export type SpecValue   = string | number | boolean;
export type SpecSection = Record<string, SpecValue>;
export type Specifications = Record<string, SpecSection>;

interface FieldError {
  sectionIdx: number;
  fieldIdx:   number;
  kind:       "key" | "value";
  message:    string;
}

interface Props {
  value:    Specifications;
  onChange: (val: Specifications) => void;
}

const MAX_SECTIONS = 50;
const MAX_FIELDS   = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSectionList(specs: Specifications): Array<{ name: string; fields: Array<{ key: string; value: SpecValue }> }> {
  return Object.entries(specs).map(([name, fields]) => ({
    name,
    fields: Object.entries(fields).map(([key, value]) => ({ key, value })),
  }));
}

function sectionsToSpecs(
  sections: Array<{ name: string; fields: Array<{ key: string; value: SpecValue }> }>
): Specifications {
  const out: Specifications = {};
  for (const sec of sections) {
    const fields: SpecSection = {};
    for (const f of sec.fields) {
      if (f.key.trim()) fields[f.key.trim()] = f.value;
    }
    if (sec.name.trim()) out[sec.name.trim()] = fields;
  }
  return out;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldRow({
  sectionIdx,
  fieldIdx,
  fieldKey,
  value,
  errors,
  onKeyChange,
  onValueChange,
  onDelete,
}: {
  sectionIdx:     number;
  fieldIdx:       number;
  fieldKey:       string;
  value:          SpecValue;
  errors:         FieldError[];
  onKeyChange:    (v: string) => void;
  onValueChange:  (v: string) => void;
  onDelete:       () => void;
}) {
  const keyErr = errors.find(
    (e) => e.sectionIdx === sectionIdx && e.fieldIdx === fieldIdx && e.kind === "key"
  );
  const valErr = errors.find(
    (e) => e.sectionIdx === sectionIdx && e.fieldIdx === fieldIdx && e.kind === "value"
  );

  return (
    <div className="flex gap-2 items-start group/field">
      {/* Key input */}
      <div className="flex-1">
        <input
          type="text"
          value={fieldKey}
          onChange={(e) => onKeyChange(e.target.value)}
          placeholder="Field name (e.g. Brand)"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all
            ${keyErr
              ? "border-red-400 focus:ring-red-300 bg-red-50"
              : "border-gray-200 focus:ring-brand-300 focus:border-brand-400"
            }`}
        />
        {keyErr && (
          <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
            <AlertCircle size={11} /> {keyErr.message}
          </p>
        )}
      </div>

      {/* Value input */}
      <div className="flex-1">
        <input
          type="text"
          value={String(value)}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Value (e.g. Yonex)"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all
            ${valErr
              ? "border-red-400 focus:ring-red-300 bg-red-50"
              : "border-gray-200 focus:ring-brand-300 focus:border-brand-400"
            }`}
        />
        {valErr && (
          <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
            <AlertCircle size={11} /> {valErr.message}
          </p>
        )}
      </div>

      {/* Delete field */}
      <button
        type="button"
        onClick={onDelete}
        className="mt-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/field:opacity-100"
        title="Remove field"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SpecificationBuilder({ value, onChange }: Props) {
  const [sections, setSections] = useState(() => buildSectionList(value));
  const [errors,   setErrors]   = useState<FieldError[]>([]);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  // Drag state
  const dragIdx   = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  // ── Sync up to parent ──────────────────────────────────────────────────────
  const syncUp = useCallback(
    (next: typeof sections) => {
      setSections(next);
      onChange(sectionsToSpecs(next));
    },
    [onChange]
  );

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = useCallback(
    (secs: typeof sections): FieldError[] => {
      const errs: FieldError[] = [];
      secs.forEach((sec, si) => {
        sec.fields.forEach((f, fi) => {
          if (!f.key.trim()) {
            errs.push({ sectionIdx: si, fieldIdx: fi, kind: "key", message: "Key cannot be empty." });
          }
          if (String(f.value).trim() === "") {
            errs.push({ sectionIdx: si, fieldIdx: fi, kind: "value", message: "Value cannot be empty." });
          }
        });
      });
      setErrors(errs);
      return errs;
    },
    []
  );

  // ── Section operations ─────────────────────────────────────────────────────
  const addSection = () => {
    if (sections.length >= MAX_SECTIONS) return;
    const next = [...sections, { name: "", fields: [{ key: "", value: "" }] }];
    syncUp(next);
  };

  const deleteSection = (idx: number) => {
    const next = sections.filter((_, i) => i !== idx);
    validate(next);
    syncUp(next);
  };

  const updateSectionName = (idx: number, name: string) => {
    const next = sections.map((s, i) => (i === idx ? { ...s, name } : s));
    syncUp(next);
  };

  const toggleCollapse = (idx: number) =>
    setCollapsed((prev) => ({ ...prev, [idx]: !prev[idx] }));

  // ── Field operations ───────────────────────────────────────────────────────
  const addField = (secIdx: number) => {
    if (sections[secIdx].fields.length >= MAX_FIELDS) return;
    const next = sections.map((s, i) =>
      i === secIdx
        ? { ...s, fields: [...s.fields, { key: "", value: "" }] }
        : s
    );
    syncUp(next);
  };

  const deleteField = (secIdx: number, fieldIdx: number) => {
    const next = sections.map((s, i) =>
      i === secIdx
        ? { ...s, fields: s.fields.filter((_, fi) => fi !== fieldIdx) }
        : s
    );
    validate(next);
    syncUp(next);
  };

  const updateFieldKey = (secIdx: number, fieldIdx: number, key: string) => {
    const next = sections.map((s, i) =>
      i === secIdx
        ? {
            ...s,
            fields: s.fields.map((f, fi) => (fi === fieldIdx ? { ...f, key } : f)),
          }
        : s
    );
    validate(next);
    syncUp(next);
  };

  const updateFieldValue = (secIdx: number, fieldIdx: number, val: string) => {
    const next = sections.map((s, i) =>
      i === secIdx
        ? {
            ...s,
            fields: s.fields.map((f, fi) => (fi === fieldIdx ? { ...f, value: val } : f)),
          }
        : s
    );
    validate(next);
    syncUp(next);
  };

  // ── Drag-and-drop section reorder ──────────────────────────────────────────
  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragEnter = (idx: number) => { dragOverIdx.current = idx; };
  const onDragEnd   = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) return;
    const next = [...sections];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(dragOverIdx.current, 0, moved);
    dragIdx.current   = null;
    dragOverIdx.current = null;
    syncUp(next);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {sections.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <p className="text-sm font-medium">No specification sections yet.</p>
          <p className="text-xs mt-1">Click "Add Section" to get started.</p>
        </div>
      )}

      {sections.map((sec, si) => {
        const isCollapsed = !!collapsed[si];
        const sectionHasError = errors.some((e) => e.sectionIdx === si);

        return (
          <div
            key={si}
            draggable
            onDragStart={() => onDragStart(si)}
            onDragEnter={() => onDragEnter(si)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`rounded-xl border transition-all ${
              sectionHasError ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-white"
            }`}
          >
            {/* Section header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              {/* Drag handle */}
              <span
                className="cursor-grab text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                title="Drag to reorder"
              >
                <GripVertical size={16} />
              </span>

              {/* Section name */}
              <input
                type="text"
                value={sec.name}
                onChange={(e) => updateSectionName(si, e.target.value)}
                placeholder="Section name (e.g. General)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold
                  focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 bg-white"
              />

              {/* Collapse toggle */}
              <button
                type="button"
                onClick={() => toggleCollapse(si)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>

              {/* Delete section */}
              <button
                type="button"
                onClick={() => deleteSection(si)}
                className="text-gray-300 hover:text-red-500 transition-colors"
                title="Delete section"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Fields */}
            {!isCollapsed && (
              <div className="px-4 py-3 space-y-2">
                {sec.fields.length === 0 && (
                  <p className="text-xs text-gray-400 py-1">No fields. Click "Add Field".</p>
                )}

                {sec.fields.map((f, fi) => (
                  <FieldRow
                    key={fi}
                    sectionIdx={si}
                    fieldIdx={fi}
                    fieldKey={f.key}
                    value={f.value}
                    errors={errors}
                    onKeyChange={(v) => updateFieldKey(si, fi, v)}
                    onValueChange={(v) => updateFieldValue(si, fi, v)}
                    onDelete={() => deleteField(si, fi)}
                  />
                ))}

                {/* Add field */}
                {sec.fields.length < MAX_FIELDS && (
                  <button
                    type="button"
                    onClick={() => addField(si)}
                    className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700
                      font-semibold mt-1 transition-colors"
                  >
                    <Plus size={12} /> Add Field
                  </button>
                )}
                {sec.fields.length >= MAX_FIELDS && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle size={11} /> Max {MAX_FIELDS} fields per section reached.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add section / cap warning */}
      {sections.length < MAX_SECTIONS ? (
        <button
          type="button"
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300
            rounded-xl py-3 text-sm font-semibold text-gray-500 hover:border-brand-400
            hover:text-brand-600 transition-all"
        >
          <Plus size={15} /> Add Section
        </button>
      ) : (
        <p className="text-xs text-amber-600 flex items-center gap-1 justify-center">
          <AlertCircle size={11} /> Maximum {MAX_SECTIONS} sections reached.
        </p>
      )}
    </div>
  );
}
