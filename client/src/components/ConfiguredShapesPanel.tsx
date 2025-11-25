import React from "react";
import { CartItem } from "@/types";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { exportShapeToDxf, DxfExportOptions } from "@/lib/dxf";

interface Props {
  items: CartItem[];
  onLoad: (item: CartItem) => void;
  onRemove: (id: string) => void;
  dxfOptions?: DxfExportOptions;
}

export function ConfiguredShapesPanel({ items, onLoad, onRemove, dxfOptions }: Props) {
  // Group items by product code (artikelcode)
  const groups = items.reduce<Record<string, typeof items>>((acc, it) => {
    const key = it.material.artikelcode || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(it);
    return acc;
  }, {});

  // Labels and ordering mirror `ShapeDims.tsx`
  const LABEL_MAP: Record<string, string> = {
    width: 'Width (mm)',
    height: 'Height (mm)',
    diameter: 'Diameter (mm)',
    major_axis: 'Major Axis (mm)',
    minor_axis: 'Minor Axis (mm)',
    side_a: 'Side A (mm)',
    side_b: 'Side B (mm)',
    side_c: 'Side C (mm)',
    flat_to_flat: 'Flat to Flat (mm)',
    outer_diameter: 'Outer Diameter (mm)',
    inner_diameter: 'Inner Diameter (mm)',
    outer_major: 'Outer Major (mm)',
    outer_minor: 'Outer Minor (mm)',
    inner_major: 'Inner Major (mm)',
    inner_minor: 'Inner Minor (mm)',
  };

  const ORDER_MAP: Record<string, string[]> = {
    rectangle: ['width', 'height'],
    circle: ['diameter'],
    triangle: ['side_a', 'side_b', 'side_c'],
    hexagon_flat: ['flat_to_flat'],
    ring: ['outer_diameter', 'inner_diameter'],
    oval: ['major_axis', 'minor_axis'],
    oval_ring: ['outer_major', 'outer_minor', 'inner_major', 'inner_minor'],
  };

  // Helper to render dims for an item (keeps JSX clean)
  const renderDims = (it: CartItem) => {
    const shapeKey = (it.shape as string) || undefined;
    const keysToShow = shapeKey && ORDER_MAP[shapeKey]
      ? ORDER_MAP[shapeKey]
      : Object.keys(it.dims || {});

    return keysToShow.map((k) => {
      const v = (it.dims as Record<string, any>)[k];
      if (v === undefined || v === null || v === '') return null;
      const label = LABEL_MAP[k] || k;
      return (
        <div key={k}>{label}: {String(v)}</div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Configured Shapes</h2>
        {items.length > 0 && (
          <div>
            <Button size="sm" variant="outline" onClick={async () => {
              // bulk download as zip
              const zip = new JSZip();
              const opts = dxfOptions || ({} as DxfExportOptions);
              for (const it of items) {
                const content = exportShapeToDxf(it.shape as any, it.dims as any, opts);
                const filename = `${it.material.artikelcode || 'item'}_${it.id}.dxf`;
                zip.file(filename, content);
              }
              const blob = await zip.generateAsync({ type: 'blob' });
              saveAs(blob, `shapes_${Date.now()}.zip`);
            }}>Download all DXF (zip)</Button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-4">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No configured shapes yet.</div>
        )}

        {Object.keys(groups).map((code) => {
          const group = groups[code];
          // Use first item's material as representative for subheader
          const mat = group[0].material;
          const density = mat.densiteit_g_cm3 ? `${mat.densiteit_g_cm3.i} (scale ${mat.densiteit_g_cm3.scale})` : "-";
          return (
            <div key={code} className="border border-border rounded-md p-3 bg-muted/10">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-medium">{mat.materiaalsoort} — {code}</div>
                  <div className="text-xs text-muted-foreground">{density} · {mat.dikte_mm} mm · {mat.kleur}</div>
                </div>
                <div className="text-xs text-muted-foreground">{group.length} configured</div>
              </div>

              <div className="space-y-2">
                {group.map((it) => (
                  <div key={it.id} className="bg-card rounded-md p-3 border border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium">Shape: {it.shape} • Amount: {it.amount}</div>
                        <div className="text-xs text-muted-foreground mt-1">Dims:</div>
                        <div className="text-xs text-muted-foreground ml-2 mt-1">
                          {renderDims(it)}
                        </div>
                        {it.options && it.options.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">Options: {it.options.join(", ")}</div>
                        )}
                      </div>
                      <div className="flex flex-col ml-3 space-y-2">
                        <Button size="sm" onClick={() => onLoad(it)} variant="outline">Load</Button>
                        <Button size="sm" onClick={() => {
                          // per-item download
                          const opts = dxfOptions || ({} as DxfExportOptions);
                          const content = exportShapeToDxf(it.shape as any, it.dims as any, opts);
                          const filename = `${it.material.artikelcode || 'item'}_${it.id}.dxf`;
                          const blob = new Blob([content], { type: 'application/dxf' });
                          saveAs(blob, filename);
                        }} variant="outline">Download DXF</Button>
                        <Button size="sm" onClick={() => onRemove(it.id)} variant="ghost">Remove</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConfiguredShapesPanel;
