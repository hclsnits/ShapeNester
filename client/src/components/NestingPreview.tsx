import { useState, useMemo } from "react";
import { ShapeKind, ShapeDims, Material, CartItem } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { calculateBoundingBox } from "@/lib/geometry/bbox";
import { calculateNesting } from "@/lib/nesting";
import { calculateAdvancedNesting } from "@/lib/advanced-nesting";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface NestingPreviewProps {
  shape: ShapeKind;
  dims: ShapeDims;
  material: Material | null;
  options?: string[];
  onAddConfiguredShape?: (item: CartItem) => void;
}

export function NestingPreview({ shape, dims, material, options = [], onAddConfiguredShape, }: NestingPreviewProps) {
  const [quantity, setQuantity] = useState(20);
  const [spacing, setSpacing] = useState(5);
  const [kerf, setKerf] = useState(1.5);
  const [algorithm, setAlgorithm] = useState<
    "simple" | "bottom_left_fill" | "best_fit" | "genetic"
  >("simple");
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [allowRotation, setAllowRotation] = useState(true);
  const [sheetLength, setSheetLength] = useState(3000); // Default 3m sheets
  const [showNestingConfig, setShowNestingConfig] = useState(false);

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

    if (useAdvanced) {
      return calculateAdvancedNesting({
        shape,
        dims,
        quantity,
        sheetWidth: material.doekbreedte_mm,
        sheetLength: sheetLength.toString(),
        spacing: spacing.toString(),
        kerf: kerf.toString(),
        algorithm,
        allowRotation,
      });
    } else {
      return calculateNesting({
        shape,
        dims,
        quantity,
        sheetWidth: material.doekbreedte_mm,
        spacing: spacing.toString(),
        kerf: kerf.toString(),
        // No orientation parameter - will auto-optimize
      });
    }
  }, [
    shape,
    dims,
    material,
    quantity,
    spacing,
    kerf,
    useAdvanced,
    algorithm,
    allowRotation,
    sheetLength,
    hasValidDims,
  ]);

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

  const renderRollLayout = () => {
    if (!nestingData) return null;

    const piecesPerRow = parseInt(nestingData.pieces_per_row);
    const rows = parseInt(nestingData.rows);
    const isAdvanced = useAdvanced && (nestingData as any).algorithm_used;

    // Check if part doesn't fit on sheet
    if (piecesPerRow === 0 || nestingData.pieces_per_row === "0") {
      return (
        <div className="bg-muted/30 rounded-lg p-4 h-48 flex flex-col items-center justify-center">
          <div className="text-xs text-muted-foreground mb-2">
            Sheet width: {material?.doekbreedte_mm}mm
          </div>
          <div className="text-center">
            <div className="text-red-500 font-medium mb-2">
              ⚠️ Part too large
            </div>
            <div className="text-sm text-muted-foreground">
              Part dimensions exceed sheet width in both orientations.
              <br />
              Try reducing dimensions or selecting wider material.
            </div>
          </div>
        </div>
      );
    }

    if (isAdvanced) {
      // Advanced nesting - show optimized layout
      const placedPieces = (nestingData as any).pieces_placed?.length || 0;
      const efficiency = (nestingData as any).efficiency_percent || "0";

      return (
        <div className="bg-muted/30 rounded-lg p-4 h-48">
          <div className="text-xs text-muted-foreground mb-2">
            Sheet: {material?.doekbreedte_mm}×{sheetLength}mm
          </div>
          <div className="flex flex-col justify-center h-32">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {placedPieces}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                pieces optimally placed
              </div>
              <div className="text-lg font-semibold text-green-600">
                {efficiency}% efficiency
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Optimized with{" "}
            {(nestingData as any).algorithm_used?.replace("_", " ") ||
              "advanced"}{" "}
            algorithm
          </div>
        </div>
      );
    } else {
      // Simple grid layout
      const totalPieces = Math.min(quantity, piecesPerRow * rows);

      return (
        <div className="bg-muted/30 rounded-lg p-4 h-48">
          <div className="text-xs text-muted-foreground mb-2">
            Sheet width: {material?.doekbreedte_mm}mm
          </div>
          <div
            className="grid gap-1 h-32"
            style={{
              gridTemplateColumns: `repeat(${Math.min(piecesPerRow, 8)}, 1fr)`,
            }}
          >
            {Array.from({ length: Math.min(totalPieces, 24) }, (_, i) => (
              <div
                key={i}
                className="bg-primary/20 border border-primary/40 rounded-sm flex items-center justify-center text-xs text-primary"
                data-testid={`piece-${i + 1}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {piecesPerRow} pieces × {rows} rows = {quantity} total
          </div>
        </div>
      );
    }
  };

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

        {/* Action Buttons */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setShowNestingConfig(true)}
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
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Nesting Configuration
        </h2>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="advanced-mode"
              checked={useAdvanced}
              onCheckedChange={setUseAdvanced}
              data-testid="switch-advanced-mode"
            />
            <Label htmlFor="advanced-mode" className="text-sm font-medium">
              Advanced Nesting Optimization
            </Label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                data-testid="input-quantity"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Spacing (mm)
              </Label>
              <Input
                type="number"
                min="0"
                value={spacing}
                onChange={(e) => setSpacing(parseFloat(e.target.value) || 0)}
                data-testid="input-spacing"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Kerf (mm)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={kerf}
                onChange={(e) => setKerf(parseFloat(e.target.value) || 0)}
                data-testid="input-kerf"
              />
            </div>
            {!useAdvanced ? (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Orientation
                </Label>
                <div
                  className="h-10 px-3 py-2 bg-muted rounded-md flex items-center text-sm"
                  data-testid="optimized-orientation"
                >
                  {nestingData
                    ? `${nestingData.orientation === 0 ? "0°" : "90°"}`
                    : "Auto-selected"}
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Sheet Length (mm)
                </Label>
                <Input
                  type="number"
                  min="1000"
                  value={sheetLength}
                  onChange={(e) =>
                    setSheetLength(parseInt(e.target.value) || 3000)
                  }
                  data-testid="input-sheet-length"
                />
              </div>
            )}
          </div>

          {useAdvanced && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Algorithm
                </Label>
                <Select
                  value={algorithm}
                  onValueChange={(
                    value:
                      | "simple"
                      | "bottom_left_fill"
                      | "best_fit"
                      | "genetic",
                  ) => setAlgorithm(value)}
                >
                  <SelectTrigger data-testid="select-algorithm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Grid</SelectItem>
                    <SelectItem value="bottom_left_fill">
                      Bottom-Left Fill
                    </SelectItem>
                    <SelectItem value="best_fit">Best Fit</SelectItem>
                    <SelectItem value="genetic">Genetic Algorithm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="allow-rotation"
                  checked={allowRotation}
                  onCheckedChange={setAllowRotation}
                  data-testid="switch-allow-rotation"
                />
                <Label htmlFor="allow-rotation" className="text-sm font-medium">
                  Allow Rotation
                </Label>
              </div>
            </div>
          )}
        </div>

        {nestingData && (
          <div className="mt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {!useAdvanced ? (
                <>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Maximum pieces per Row
                    </div>
                    <div
                      className="text-lg font-semibold text-foreground"
                      data-testid="text-pieces-per-row"
                    >
                      {nestingData.pieces_per_row}
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Number of Rows
                    </div>
                    <div
                      className="text-lg font-semibold text-foreground"
                      data-testid="text-number-of-rows"
                    >
                      {nestingData.rows}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Algorithm
                    </div>
                    <div
                      className="text-lg font-semibold text-foreground"
                      data-testid="text-algorithm-used"
                    >
                      {(nestingData as any).algorithm_used?.replace("_", " ") ||
                        "Simple"}
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Efficiency
                    </div>
                    <div
                      className="text-lg font-semibold text-foreground"
                      data-testid="text-efficiency"
                    >
                      {(nestingData as any).efficiency_percent || "85"}%
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">
                      Pieces Placed
                    </div>
                    <div
                      className="text-lg font-semibold text-foreground"
                      data-testid="text-pieces-placed"
                    >
                      {(nestingData as any).pieces_placed?.length || 0}
                    </div>
                  </div>
                </>
              )}
              <div className="bg-accent/50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">
                  Material Usage
                </div>
                <div
                  className="text-lg font-semibold text-foreground"
                  data-testid="text-material-usage"
                >
                  {(
                    Number(nestingData.material_m2.i) /
                    Math.pow(10, nestingData.material_m2.scale)
                  ).toFixed(2)}{" "}
                  m²
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Roll Layout Section moved here from the preview */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Roll Layout
          </h3>
          {renderRollLayout()}
        </div>
      </div>
      )}
    </>
  );
}
