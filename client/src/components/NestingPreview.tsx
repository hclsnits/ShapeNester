import { useState, useMemo } from "react";
import { ShapeKind, ShapeDims, Material, CartItem } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { calculateBoundingBox } from "@/lib/geometry/bbox";
import { calculateNesting } from "@/lib/nesting";
// advanced nesting removed per request
// import { calculateAdvancedNesting } from "@/lib/advanced-nesting";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// advanced nesting switch removed from UI
// import { Switch } from "@/components/ui/switch";

interface NestingPreviewProps {
  shape: ShapeKind;
  dims: ShapeDims;
  material: Material | null;
  options?: string[];
  onAddConfiguredShape?: (item: CartItem) => void;
  configuredItems?: CartItem[];
}

export function NestingPreview({ shape, dims, material, options = [], onAddConfiguredShape, configuredItems, }: NestingPreviewProps) {
  const [quantity, setQuantity] = useState(20);
  const [spacing, setSpacing] = useState(5);
  const [kerf, setKerf] = useState(1.5);
  // advanced nesting state removed from UI; kept here commented for reference
  // const [algorithm, setAlgorithm] = useState<
  //   "simple" | "bottom_left_fill" | "best_fit" | "genetic"
  // >("simple");
  // const [useAdvanced, setUseAdvanced] = useState(false);
  // const [allowRotation, setAllowRotation] = useState(true);
  // const [sheetLength, setSheetLength] = useState(3000); // Default 3m sheets
  const [showNestingConfig, setShowNestingConfig] = useState(false);
  const [nestedItems, setNestedItems] = useState<CartItem[]>([]);

  const hasValidDims = (() => {
    switch (shape) {
      case "rectangle":
        return (
          dims.width &&
          dims.height &&
          parseInt(dims.width) > 0 &&
          parseInt(dims.height) > 0
        );
      case "circle":
        return dims.diameter && parseInt(dims.diameter) > 0;
      case "triangle":
        return (
          dims.side_a &&
          dims.side_b &&
          dims.side_c &&
          parseInt(dims.side_a) > 0 &&
          parseInt(dims.side_b) > 0 &&
          parseInt(dims.side_c) > 0
        );
      case "hexagon_flat":
        return dims.flat_to_flat && parseInt(dims.flat_to_flat) > 0;
      case "ring":
        return (
          dims.outer_diameter &&
          dims.inner_diameter &&
          parseInt(dims.outer_diameter) > 0 &&
          parseInt(dims.inner_diameter) > 0
        );
      case "oval":
        return (
          dims.major_axis &&
          dims.minor_axis &&
          parseInt(dims.major_axis) > 0 &&
          parseInt(dims.minor_axis) > 0
        );
      case "oval_ring":
        return (
          dims.outer_major &&
          dims.outer_minor &&
          dims.inner_major &&
          dims.inner_minor &&
          parseInt(dims.outer_major) > 0 &&
          parseInt(dims.outer_minor) > 0 &&
          parseInt(dims.inner_major) > 0 &&
          parseInt(dims.inner_minor) > 0
        );
      default:
        return false;
    }
  })();

  const nestingData = useMemo(() => {
    if (!material || !hasValidDims) return null;

    // Advanced nesting removed — always use simple calculateNesting for now
    return calculateNesting({
      shape,
      dims,
      quantity,
      sheetWidth: material.doekbreedte_mm,
      spacing: spacing.toString(),
      kerf: kerf.toString(),
    });
  }, [shape, dims, material, quantity, spacing, kerf, hasValidDims]);

  const bbox = hasValidDims ? calculateBoundingBox(shape, dims) : null;

  const renderShapeOutline = () => {
    if (!bbox) return null;

    const bboxWidth = parseInt(bbox.width);
    const bboxHeight = parseInt(bbox.height);

    if (
      !Number.isFinite(bboxWidth) ||
      !Number.isFinite(bboxHeight) ||
      bboxWidth <= 0 ||
      bboxHeight <= 0
    ) {
      return (
        <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
          Invalid dimensions
        </div>
      );
    }

    const renderShape2D = (
      cx: number,
      cy: number,
      w: number,
      h: number,
    ) => {
      if (shape === "rectangle") {
        return <rect x={0} y={0} width={w} height={h} fill="black" stroke="none" />;
      }

      if (shape === "circle") {
        const r = Math.min(w, h) / 2;
        return <circle cx={cx} cy={cy} r={r} fill="black" stroke="none" />;
      }

      if (shape === "ring") {
        const rOuter = Math.min(w, h) / 2;
        const outerD = parseFloat(dims.outer_diameter || "0");
        const innerD = parseFloat(dims.inner_diameter || "0");
        const rInner = outerD > 0 ? (innerD / outerD) * rOuter : rOuter * 0.5;
        return (
          <>
            <circle cx={cx} cy={cy} r={rOuter} fill="black" stroke="none" />
            <circle cx={cx} cy={cy} r={rInner} fill="white" stroke="none" />
          </>
        );
      }

      if (shape === "triangle") {
        return (
          <polygon
            points={`${w / 2},0 0,${h} ${w},${h}`}
            fill="black"
            stroke="none"
          />
        );
      }

      if (shape === "hexagon_flat") {
        // flat-top hexagon scaled to bbox
        const w2 = w;
        const h2 = h;
        const points = [
          `${w2 * 0.5},0`,
          `${w2},${h2 * 0.25}`,
          `${w2},${h2 * 0.75}`,
          `${w2 * 0.5},${h2}`,
          `0,${h2 * 0.75}`,
          `0,${h2 * 0.25}`,
        ].join(" ");
        return <polygon points={points} fill="black" stroke="none" />;
      }

      if (shape === "oval") {
        return (
          <ellipse cx={cx} cy={cy} rx={w / 2} ry={h / 2} fill="black" stroke="none" />
        );
      }

      if (shape === "oval_ring") {
        const outerRx = w / 2;
        const outerRy = h / 2;
        const outerMajor = parseFloat(dims.outer_major || "0");
        const innerMajor = parseFloat(dims.inner_major || "0");
        const ratio = outerMajor > 0 ? innerMajor / outerMajor : 0.5;
        const innerRx = outerRx * ratio;
        const innerRy = outerRy * ratio;
        return (
          <>
            <ellipse cx={cx} cy={cy} rx={outerRx} ry={outerRy} fill="black" stroke="none" />
            <ellipse cx={cx} cy={cy} rx={innerRx} ry={innerRy} fill="white" stroke="none" />
          </>
        );
      }

      // Fallback - rectangle
      return <rect x={0} y={0} width={w} height={h} fill="black" stroke="none" />;
    };

    // Determine display size while keeping aspect ratio
    const displayWidth = 320;
    const displayHeight = Math.max(120, Math.round((displayWidth * bboxHeight) / bboxWidth));

    const cx = bboxWidth / 2;
    const cy = bboxHeight / 2;

    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${bboxWidth} ${bboxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="border-2 border-primary bg-white"
          data-testid="shape-outline-svg"
        >
          <rect
            x={0}
            y={0}
            width={bboxWidth}
            height={bboxHeight}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            strokeDasharray="2"
            className="text-muted-foreground opacity-30"
          />
          {renderShape2D(cx, cy, bboxWidth, bboxHeight)}
        </svg>
        <div className="text-sm text-muted-foreground">
          {bbox.width} × {bbox.height} mm
        </div>
      </div>
    );
  };

  // Roll layout removed completely per request

  return (
    <>
      <div
        className="bg-card rounded-lg border border-border p-6 mb-6"
        data-testid="nesting-preview"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Shape & Nesting Preview
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Shape Outline
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center h-[40vh] min-h-[200px] overflow-hidden">
              {renderShapeOutline()}
            </div>
          </div>

          {/* Roll Layout moved into Nesting Configuration below */}
        </div>

        {/* Quantity control shown under the 2D viewer and above the action buttons */}
        <div className="mt-4 mb-4">
          <div className="grid grid-cols-2 items-center gap-4 max-w-sm">
            <Label className="text-sm font-medium">Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              data-testid="input-quantity"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
            <button
            onClick={() => {
              // copy configured items into the local nesting configuration
              if (Array.isArray(configuredItems)) {
                setNestedItems(configuredItems as CartItem[]);
              }
              setShowNestingConfig(true);
            }}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition"
          >
            Proceed to nesting step
          </button>
          <button
            onClick={() => {
              // Create configured shape metadata and pass to parent
              if (!material) return;
              const nestingSummary = nestingData || {
                orientation: 0 as 0 | 90,
                pieces_per_row: "0",
                rows: "0",
                total_length_mm: "0",
                rest_width_mm: "0",
                material_m2: { i: "0", scale: 0 },
              };

              const costing = {
                base_m2: nestingSummary.material_m2,
                material_cost_cents: "0",
                options_cost_cents: "0",
                work_cost_cents: "0",
                kot_cents: "0",
                total_cents: "0",
              };

              const item: CartItem = {
                id: uuidv4(),
                created_at: new Date().toISOString(),
                material,
                shape,
                dims: { ...dims },
                amount: quantity,
                nesting: nestingSummary,
                costing,
                options,
              };

              if (onAddConfiguredShape) onAddConfiguredShape(item);
              // keep UI stable; optionally reset quantity
              setQuantity(20);
            }}
            className="flex-1 px-4 py-2 border border-input bg-background text-foreground rounded-md font-medium hover:bg-accent transition"
          >
            Add another shape
          </button>
        </div>
      </div>

      {showNestingConfig && (
      <div
        className="bg-card rounded-lg border border-border p-6 mb-6"
        data-testid="nesting-settings"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Nesting Configuration
          </h2>
          <div>
            <Button size="sm" variant="outline" onClick={() => {
              if (Array.isArray(configuredItems)) {
                setNestedItems(configuredItems as CartItem[]);
              } else {
                setNestedItems([]);
              }
            }}>
              Reload configured shapes
            </Button>
          </div>
        </div>

        {/* Summary of configured items copied into nesting config */}
        {nestedItems && nestedItems.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Configured articles summary</div>
            <div className="space-y-2">
              {Object.entries(
                nestedItems.reduce<Record<string, { count: number; label: string }>>((acc, it) => {
                  const key = it.material.artikelcode || 'unknown';
                  if (!acc[key]) acc[key] = { count: 0, label: it.material.materiaalsoort || key };
                  acc[key].count += (it.amount || 1);
                  return acc;
                }, {})
              ).map(([code, info]) => (
                <div key={code} className="flex items-center justify-between bg-muted/10 p-2 rounded">
                  <div className="text-sm font-medium">{info.label} — {code}</div>
                  <div className="text-sm text-muted-foreground">Quantity: {info.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advanced nesting UI removed per request. The following controls were
            intentionally removed: Advanced Optimization switch, Orientation/
            Sheet Length input, Algorithm selector and Allow Rotation. */}

        {/* Pieces/rows/material usage and the Roll Layout were removed per request.
            The detailed cards and roll preview (previously shown here) are
            intentionally commented-out/removed to simplify the UI. */}
      </div>
      )}
    </>
  );
}
