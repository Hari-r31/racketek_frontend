"use client";
/**
 * ProductCatalogSections
 * Renders: Highlights, Specifications (grouped), Manufacturer Info
 * Fully dynamic — zero hardcoded keys. Empty sections auto-hidden.
 */
import { CheckCircle2, Factory, Settings2 } from "lucide-react";
import { Product, Specifications, ManufacturerInfo } from "@/types";

interface Props { product: Product; }

function HighlightsSection({ highlights }: { highlights: string[] }) {
  if (!highlights?.length) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-base font-black text-gray-900 mb-4">
        <CheckCircle2 size={18} className="text-brand-600" />
        Product Highlights
      </h3>
      <ul className="space-y-2.5">
        {highlights.map((point, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-gray-700 leading-relaxed">
            <CheckCircle2 size={15} className="text-brand-500 shrink-0 mt-0.5" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpecificationsSection({ specifications }: { specifications: Specifications }) {
  const nonEmpty = Object.entries(specifications ?? {}).filter(
    ([, fields]) => Object.keys(fields).length > 0
  );
  if (!nonEmpty.length) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-base font-black text-gray-900 mb-4">
        <Settings2 size={18} className="text-brand-600" />
        Specifications
      </h3>
      <div className="space-y-6">
        {nonEmpty.map(([sectionName, fields]) => (
          <div key={sectionName}>
            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">
              {sectionName}
            </p>
            <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
              <tbody className="divide-y divide-gray-100">
                {Object.entries(fields).map(([key, value]) => (
                  <tr key={key} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-gray-700 w-2/5 bg-gray-50/50">{key}</td>
                    <td className="py-2.5 px-4 text-gray-600">{String(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManufacturerSection({ info }: { info: ManufacturerInfo }) {
  if (!Object.keys(info ?? {}).length) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-base font-black text-gray-900 mb-4">
        <Factory size={18} className="text-brand-600" />
        Manufacturer Information
      </h3>
      <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden">
        <tbody className="divide-y divide-gray-100">
          {Object.entries(info).map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50/70 transition-colors">
              <td className="py-2.5 px-4 font-semibold text-gray-700 w-2/5 bg-gray-50/50">{key}</td>
              <td className="py-2.5 px-4 text-gray-600">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProductCatalogSections({ product }: Props) {
  const hasHighlights   = (product.highlights?.length ?? 0) > 0;
  const hasSpecs        = Object.keys(product.specifications ?? {}).length > 0;
  const hasManufacturer = Object.keys(product.manufacturer_info ?? {}).length > 0;
  if (!hasHighlights && !hasSpecs && !hasManufacturer) return null;
  return (
    <div className="space-y-10 mt-2">
      {hasHighlights   && <HighlightsSection    highlights={product.highlights!} />}
      {hasSpecs        && <SpecificationsSection specifications={product.specifications!} />}
      {hasManufacturer && <ManufacturerSection   info={product.manufacturer_info!} />}
    </div>
  );
}
