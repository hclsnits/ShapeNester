import React from "react";
import { CartItem } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  items: CartItem[];
  onLoad: (item: CartItem) => void;
  onRemove: (id: string) => void;
}

export function ConfiguredShapesPanel({ items, onLoad, onRemove }: Props) {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-semibold text-foreground mb-4">Configured Shapes</h2>
      <div className="flex-1 overflow-y-auto space-y-3">
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No configured shapes yet.</div>
        )}

        {items.map((it) => (
          <div key={it.id} className="bg-muted/20 rounded-md p-3 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{it.material.materiaalsoort} — {it.material.artikelcode}</div>
                <div className="text-xs text-muted-foreground">Shape: {it.shape} • Amount: {it.amount}</div>
                <div className="text-xs text-muted-foreground mt-1">Density: {it.material.densiteit_g_cm3?.i ?? "-"} (scale {it.material.densiteit_g_cm3?.scale ?? "-"})</div>
                <div className="text-xs text-muted-foreground">Thickness: {it.material.dikte_mm} mm</div>
                <div className="text-xs text-muted-foreground">Color: {it.material.kleur}</div>
                <div className="text-xs text-muted-foreground">Fabric width: {it.material.doekbreedte_mm} mm</div>
                <div className="text-xs text-muted-foreground">Price/m²: {it.material.prijs_per_m2_cents} cents</div>
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
}

export default ConfiguredShapesPanel;
