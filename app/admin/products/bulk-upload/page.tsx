"use client";
/**
 * Admin Bulk Product Upload Page
 * FEATURE 1: Upload CSV or Excel file to create products in bulk.
 */
import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Upload, FileSpreadsheet, CheckCircle2,
  XCircle, AlertTriangle, Download, RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface ErrorRow {
  row: number;
  s_no: string;
  name: string;
  errors: string[];
}

interface UploadResult {
  success_count: number;
  failed_count: number;
  total_rows: number;
  error_rows: ErrorRow[];
  message: string;
}

const TEMPLATE_HEADERS = [
  "S.NO", "Category", "Sub_Category", "Product Name", "Product details",
  "Quantity", "Product Image location", "Sub_Image location",
  "Extra details", "Item code", "Key Features", "Price", "Brand",
  "Difficulty", "Gender",
];

function downloadTemplate() {
  const rows = [
    TEMPLATE_HEADERS,
    [
      "1", "SHUTTLE", "BADMINTON RACKETS",
      "ADIDAS RACKET SPIELER A09.1", "Weight: 84g | Max Tension: 28 lbs",
      "8", "https://example.com/images/racket1.jpg",
      "https://example.com/images/racket1_sub.jpg",
      "Graphite build", "38625489076",
      "Isometric Head Shape, G5 Grip",
      "2499", "ADIDAS", "intermediate", "unisex",
    ],
  ];
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bulk_upload_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkUploadPage() {
  const router = useRouter();
  const qc     = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file,       setFile]       = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [result,     setResult]     = useState<UploadResult | null>(null);
  const [dragOver,   setDragOver]   = useState(false);

  const handleFile = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext || "")) {
      toast.error("Only CSV (.csv) and Excel (.xlsx, .xls) files are supported");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<UploadResult>(
        "/admin/products/bulk-upload",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setResult(data);
      if (data.success_count > 0) {
        await qc.invalidateQueries({ queryKey: ["admin-products"] });
        await qc.invalidateQueries({ queryKey: ["products"] });
        await qc.invalidateQueries({ queryKey: ["admin-inventory"] });
        toast.success(`${data.success_count} product${data.success_count !== 1 ? "s" : ""} imported!`);
      } else {
        toast.error("No products were imported. Check the errors below.");
      }
    } catch (e: any) {
      const detail = e.response?.data?.detail || "Upload failed";
      toast.error(detail);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/products"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bulk Product Upload</h1>
          <p className="text-sm text-gray-400 mt-0.5">Import multiple products at once via CSV or Excel</p>
        </div>
      </div>

      {/* Download template */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
        <FileSpreadsheet size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-blue-800 text-sm mb-1">Start with the template</p>
          <p className="text-blue-700 text-xs leading-relaxed mb-3">
            Download the template CSV to see the exact column format. Fill it in and re-upload.
            Supported columns: S.NO, Category, Sub_Category, Product Name, Product details,
            Quantity, Product Image location, Sub_Image location, Extra details, Item code,
            Key Features, Price, Brand, Difficulty, Gender.
          </p>
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            <Download size={12} /> Download Template CSV
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Upload File</h2>
        </div>
        <div className="p-6">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-brand-500 bg-brand-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-brand-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet size={32} className="text-green-500" />
                <p className="font-bold text-green-800">{file.name}</p>
                <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB — ready to upload</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); reset(); }}
                  className="text-xs text-red-500 hover:underline mt-1"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Upload size={32} />
                <p className="text-sm font-medium">Drop your CSV or Excel file here, or click to browse</p>
                <p className="text-xs text-gray-400">Accepted: .csv, .xlsx, .xls</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {uploading
                ? <><RefreshCw size={15} className="animate-spin" /> Importing…</>
                : <><Upload size={15} /> Import Products</>
              }
            </button>
            <Link href="/admin/products"
              className="flex-1 border-2 border-gray-300 text-gray-700 font-bold py-3 rounded-xl text-center hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-gray-800">{result.total_rows}</p>
              <p className="text-xs text-gray-500 mt-1 font-medium">Total Rows</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-green-700">{result.success_count}</p>
              <p className="text-xs text-green-600 mt-1 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 size={11} /> Imported
              </p>
            </div>
            <div className={`border rounded-xl p-4 text-center ${result.failed_count > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
              <p className={`text-3xl font-black ${result.failed_count > 0 ? "text-red-700" : "text-gray-500"}`}>{result.failed_count}</p>
              <p className={`text-xs mt-1 font-medium flex items-center justify-center gap-1 ${result.failed_count > 0 ? "text-red-600" : "text-gray-400"}`}>
                <XCircle size={11} /> Failed
              </p>
            </div>
          </div>

          {/* Success message */}
          {result.success_count > 0 && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              <p className="text-sm text-green-800 font-medium">{result.message}</p>
              <Link href="/admin/products" className="ml-auto text-xs font-bold text-green-700 hover:underline shrink-0">
                View Products →
              </Link>
            </div>
          )}

          {/* Error rows */}
          {result.error_rows.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-red-50 flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-600" />
                <h3 className="font-bold text-red-800 text-sm">
                  {result.error_rows.length} row{result.error_rows.length !== 1 ? "s" : ""} had errors
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {result.error_rows.map((err, i) => (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Row {err.row}</span>
                      {err.s_no && err.s_no !== String(err.row) && (
                        <span className="text-xs text-gray-400">S.NO: {err.s_no}</span>
                      )}
                      <span className="text-sm font-semibold text-gray-800 truncate">{err.name}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {err.errors.map((e, j) => (
                        <li key={j} className="text-xs text-red-600 flex items-start gap-1.5">
                          <span className="mt-0.5 shrink-0">•</span>{e}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Column reference */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 text-sm">Column Reference</h2>
        </div>
        <div className="p-5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-bold text-gray-600 w-40">Column Name</th>
                <th className="text-left py-2 font-bold text-gray-600">Description</th>
                <th className="text-left py-2 font-bold text-gray-600 w-20">Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ["S.NO",                     "Row number (optional, informational only)", "No"],
                ["Category",                 "Parent category name (auto-created if missing)", "No"],
                ["Sub_Category",             "Sub-category name (auto-created if missing)", "No"],
                ["Product Name",             "Product display name", "Yes"],
                ["Product details",          "Full product description", "No"],
                ["Quantity",                 "Stock quantity (numeric)", "No"],
                ["Product Image location",   "Primary image URL (https://... or /path)", "No"],
                ["Sub_Image location",       "Secondary image URL", "No"],
                ["Extra details",            "Short description (1 line)", "No"],
                ["Item code",                "SKU / item code (must be unique)", "No"],
                ["Key Features",             "Comma-separated feature tags", "No"],
                ["Price",                    "Selling price in ₹ (numeric)", "No"],
                ["Brand",                    "Brand name", "No"],
                ["Difficulty",               "beginner / intermediate / advanced", "No"],
                ["Gender",                   "male / female / unisex / boys / girls", "No"],
              ].map(([col, desc, req]) => (
                <tr key={col} className="hover:bg-gray-50">
                  <td className="py-2 font-mono text-gray-700 font-medium pr-4">{col}</td>
                  <td className="py-2 text-gray-500">{desc}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req === "Yes" ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      {req}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
