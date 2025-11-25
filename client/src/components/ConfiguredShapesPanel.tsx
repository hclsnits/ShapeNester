import React from "react";
import { CartItem } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  items: CartItem[];
  onLoad: (item: CartItem) => void;
  onRemove: (id: string) => void;
}

export function ConfiguredShapesPanel({ items, onLoad, onRemove }: Props) {
  // Group items by product code (artikelcode)
  const groups = items.reduce<Record<string, typeof items>>((acc, it) => {
    const key = it.material.artikelcode || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(it);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-foreground mb-4">Configured Shapes</h2>
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
                        <div className="text-xs text-muted-foreground mt-1">Dims: {JSON.stringify(it.dims)}</div>
                        {it.options && it.options.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">Options: {it.options.join(", ")}</div>
                        )}
                      </div>
                      <div className="flex flex-col ml-3 space-y-2">
                        <Button size="sm" onClick={() => onLoad(it)} variant="outline">Load</Button>
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
