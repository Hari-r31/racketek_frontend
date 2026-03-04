"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, Film, Loader2, Check, ExternalLink, Link2 } from "lucide-react";
import api from "@/lib/api";
import Image from "next/image";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspect?: "square" | "wide" | "banner" | "portrait";
  acceptVideo?: boolean;
  folder?: string;
}

const ASPECT_CLASS: Record<string, string> = {
  square:   "aspect-square",
  wide:     "aspect-video",
  banner:   "aspect-[4/1]",
  portrait: "aspect-[3/4]",
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE   = 10  * 1024 * 1024;
const MAX_VIDEO   = 200 * 1024 * 1024;

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|avi)(\?|$)/i.test(url);
}

/** Decide which endpoint to call based on folder */
function uploadEndpoint(folder: string, isVideo: boolean): string {
  if (folder.includes("avatar")) return "/upload/avatar";
  return `/upload?folder=${encodeURIComponent(folder)}`;
}

export default function CloudinaryUploader({
  value, onChange,
  label, hint,
  aspect = "wide",
  acceptVideo = false,
  folder = "racketek/general",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [dragOver,  setDragOver]  = useState(false);
  const [error,     setError]     = useState("");
  const [urlInput,  setUrlInput]  = useState(false);
  const [pasteVal,  setPasteVal]  = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    const isVideo = VIDEO_TYPES.includes(file.type);
    const isImage = IMAGE_TYPES.includes(file.type);

    if (!isImage && !(acceptVideo && isVideo)) {
      setError(acceptVideo ? "Only images or videos allowed" : "Only image files allowed (JPG, PNG, WebP)");
      return;
    }
    if (file.size > (isVideo ? MAX_VIDEO : MAX_IMAGE)) {
      setError(isVideo ? "Video too large (max 200 MB)" : "Image too large (max 10 MB)");
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const endpoint = uploadEndpoint(folder, isVideo);

      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });

      const url = res.data?.url || res.data?.secure_url || "";
      if (!url) throw new Error("No URL returned from server");
      onChange(url);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Upload failed";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onChange, acceptVideo, folder]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const applyPaste = () => {
    const v = pasteVal.trim();
    if (v) { onChange(v); setUrlInput(false); setPasteVal(""); }
  };

  const aspectCls = ASPECT_CLASS[aspect] ?? "aspect-video";
  const hasValue  = Boolean(value);
  const isVid     = hasValue && isVideoUrl(value!);
  const acceptStr = acceptVideo
    ? "image/jpeg,image/png,image/webp,video/mp4,video/webm"
    : "image/jpeg,image/png,image/webp,image/gif,image/avif";

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
      )}

      {/* ── Preview ─────────────────────────────────────────────────────── */}
      {hasValue ? (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
          <div className={`relative ${aspectCls} w-full`}>
            {isVid ? (
              <video src={value} className="w-full h-full object-cover" muted playsInline />
            ) : (
              <Image src={value!} alt="" fill className="object-cover" sizes="600px" unoptimized />
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <button type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 bg-white text-gray-900 font-bold text-xs px-3 py-2 rounded-lg hover:bg-gray-100 shadow transition-colors"
            >
              {uploading
                ? <Loader2 size={11} className="animate-spin" />
                : <Upload size={11} />}
              {uploading ? `${progress}%` : "Replace"}
            </button>
            <a href={value} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white text-gray-700 font-bold text-xs px-3 py-2 rounded-lg hover:bg-gray-100 shadow transition-colors">
              <ExternalLink size={11} /> View
            </a>
            <button type="button"
              onClick={() => onChange("")}
              className="flex items-center gap-1.5 bg-red-600 text-white font-bold text-xs px-3 py-2 rounded-lg hover:bg-red-700 shadow transition-colors">
              <X size={11} /> Remove
            </button>
          </div>

          {/* Done badge */}
          <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow">
            <Check size={10} className="text-white" />
          </div>
          {isVid && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Film size={9} /> VIDEO
            </div>
          )}
        </div>
      ) : (
        /* ── Drop zone ──────────────────────────────────────────────────── */
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={[
            "relative rounded-xl border-2 border-dashed cursor-pointer transition-all",
            "flex flex-col items-center justify-center gap-3 select-none",
            aspectCls,
            dragOver
              ? "border-brand-500 bg-brand-50"
              : "border-gray-200 bg-gray-50 hover:border-brand-400 hover:bg-brand-50/50",
            uploading ? "cursor-wait pointer-events-none" : "",
          ].join(" ")}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              {/* Circular progress */}
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#16a34a" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                    className="transition-all duration-150" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                  {progress}%
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Uploading…</p>
            </div>
          ) : (
            <>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                dragOver ? "bg-brand-200" : "bg-brand-100"
              }`}>
                {acceptVideo
                  ? <Film size={22} className="text-brand-600" />
                  : <ImageIcon size={22} className="text-brand-600" />}
              </div>
              <div className="text-center px-4">
                <p className="text-sm font-semibold text-gray-700">
                  {dragOver ? "Drop to upload" : "Click or drag & drop"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {acceptVideo
                    ? "PNG, JPG, WebP, MP4 · max 200 MB"
                    : "PNG, JPG, WebP · max 10 MB"}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Hidden file input ────────────────────────────────────────────── */}
      <input
        ref={inputRef}
        type="file"
        accept={acceptStr}
        className="hidden"
        onChange={e => e.target.files?.[0] && upload(e.target.files[0])}
      />

      {/* ── URL paste toggle ─────────────────────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setUrlInput(v => !v)}
          className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-brand-600 transition-colors"
        >
          <Link2 size={11} />
          {urlInput ? "Cancel URL paste" : "Or paste a URL instead"}
        </button>
        {urlInput && (
          <div className="flex gap-2 mt-1.5">
            <input
              type="text"
              value={pasteVal}
              onChange={e => setPasteVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && applyPaste()}
              placeholder="https://res.cloudinary.com/…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={applyPaste}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 bg-red-50 px-3 py-2 rounded-lg">
          <X size={11} className="shrink-0" /> {error}
        </p>
      )}

      {hint && <p className="text-[11px] text-gray-400 leading-relaxed">{hint}</p>}
    </div>
  );
}
