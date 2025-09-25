import { useState, useMemo } from 'react';
import { ShapeKind, ShapeDims, Material } from '@/types';
import { calculateBoundingBox } from '@/lib/geometry/bbox';
import { calculateNesting } from '@/lib/nesting';
import { calculateAdvancedNesting } from '@/lib/advanced-nesting';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface NestingPreviewProps {
  shape: ShapeKind;
  dims: ShapeDims;
  material: Material | null;
}

export function NestingPreview({ shape, dims, material }: NestingPreviewProps) {
  const [quantity, setQuantity] = useState(20);
  const [spacing, setSpacing] = useState(5);
  const [kerf, setKerf] = useState(1.5);
  const [algorithm, setAlgorithm] = useState<'simple' | 'bottom_left_fill' | 'best_fit' | 'genetic'>('simple');
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [allowRotation, setAllowRotation] = useState(true);
  const [sheetLength, setSheetLength] = useState(3000); // Default 3m sheets

  const hasValidDims = (() => {
    switch (shape) {
      case 'rectangle':
        return dims.width && dims.height && parseInt(dims.width) > 0 && parseInt(dims.height) > 0;
      case 'circle':
        return dims.diameter && parseInt(dims.diameter) > 0;
      case 'triangle':
        return dims.side_a && dims.side_b && dims.side_c && 
               parseInt(dims.side_a) > 0 && parseInt(dims.side_b) > 0 && parseInt(dims.side_c) > 0;
      case 'hexagon_flat':
        return dims.flat_to_flat && parseInt(dims.flat_to_flat) > 0;
      case 'ring':
        return dims.outer_diameter && dims.inner_diameter && 
               parseInt(dims.outer_diameter) > 0 && parseInt(dims.inner_diameter) > 0;
      case 'oval':
        return dims.major_axis && dims.minor_axis && 
               parseInt(dims.major_axis) > 0 && parseInt(dims.minor_axis) > 0;
      case 'oval_ring':
        return dims.outer_major && dims.outer_minor && dims.inner_major && dims.inner_minor &&
               parseInt(dims.outer_major) > 0 && parseInt(dims.outer_minor) > 0 && 
               parseInt(dims.inner_major) > 0 && parseInt(dims.inner_minor) > 0;
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
        allowRotation
      });
    } else {
      return calculateNesting({
        shape,
        dims,
        quantity,
        sheetWidth: material.doekbreedte_mm,
        spacing: spacing.toString(),
        kerf: kerf.toString()
        // No orientation parameter - will auto-optimize
      });
    }
  }, [shape, dims, material, quantity, spacing, kerf, useAdvanced, algorithm, allowRotation, sheetLength, hasValidDims]);

  const bbox = hasValidDims ? calculateBoundingBox(shape, dims) : null;

  const renderShapeOutline = () => {
    if (!bbox) return null;
    
    const bboxWidth = parseInt(bbox.width);
    const bboxHeight = parseInt(bbox.height);
    
    // Guard against invalid dimensions
    if (!Number.isFinite(bboxWidth) || !Number.isFinite(bboxHeight) || bboxWidth <= 0 || bboxHeight <= 0) {
      return (
        <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
          Invalid dimensions
        </div>
      );
    }
    
    const scale = Math.min(100 / bboxWidth, 60 / bboxHeight);
    const scaledWidth = bboxWidth * scale;
    const scaledHeight = bboxHeight * scale;

    return (
      <svg 
        width="120" 
        height="80" 
        viewBox="0 0 120 80" 
        className="border border-primary"
        data-testid="shape-outline-svg"
      >
        <rect 
          x={(120 - scaledWidth) / 2} 
          y={(80 - scaledHeight) / 2} 
          width={scaledWidth} 
          height={scaledHeight} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          className="text-primary"
        />
        <text 
          x="60" 
          y="45" 
          textAnchor="middle" 
          className="text-xs fill-current text-muted-foreground"
        >
          {bbox.width}×{bbox.height}mm
        </text>
      </svg>
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
            <div className="text-red-500 font-medium mb-2">⚠️ Part too large</div>
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
              <div className="text-2xl font-bold text-primary mb-2">{placedPieces}</div>
              <div className="text-sm text-muted-foreground mb-1">pieces optimally placed</div>
              <div className="text-lg font-semibold text-green-600">{efficiency}% efficiency</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Optimized with {(nestingData as any).algorithm_used?.replace('_', ' ') || 'advanced'} algorithm
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
          <div className="grid gap-1 h-32" style={{ 
            gridTemplateColumns: `repeat(${Math.min(piecesPerRow, 8)}, 1fr)` 
          }}>
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
      <div className="bg-card rounded-lg border border-border p-6 mb-6" data-testid="nesting-preview">
        <h2 className="text-lg font-semibold text-foreground mb-4">Shape & Nesting Preview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Shape Outline</h3>
            <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center h-48">
              {renderShapeOutline()}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Roll Layout</h3>
            {renderRollLayout()}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6" data-testid="nesting-settings">
        <h2 className="text-lg font-semibold text-foreground mb-4">Nesting Configuration</h2>
        
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
              <Label className="text-sm font-medium mb-2 block">Spacing (mm)</Label>
              <Input
                type="number"
                min="0"
                value={spacing}
                onChange={(e) => setSpacing(parseFloat(e.target.value) || 0)}
                data-testid="input-spacing"
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Kerf (mm)</Label>
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
                <Label className="text-sm font-medium mb-2 block">Orientation</Label>
                <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center text-sm" data-testid="optimized-orientation">
                  {nestingData ? `${nestingData.orientation === 0 ? '0°' : '90°'}` : 'Auto-selected'}
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium mb-2 block">Sheet Length (mm)</Label>
                <Input
                  type="number"
                  min="1000"
                  value={sheetLength}
                  onChange={(e) => setSheetLength(parseInt(e.target.value) || 3000)}
                  data-testid="input-sheet-length"
                />
              </div>
            )}
          </div>
          
          {useAdvanced && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Algorithm</Label>
                <Select 
                  value={algorithm} 
                  onValueChange={(value: 'simple' | 'bottom_left_fill' | 'best_fit' | 'genetic') => setAlgorithm(value)}
                >
                  <SelectTrigger data-testid="select-algorithm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Grid</SelectItem>
                    <SelectItem value="bottom_left_fill">Bottom-Left Fill</SelectItem>
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
                    <div className="text-sm text-muted-foreground">Pieces per Row</div>
                    <div className="text-lg font-semibold text-foreground" data-testid="text-pieces-per-row">
                      {nestingData.pieces_per_row}
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Number of Rows</div>
                    <div className="text-lg font-semibold text-foreground" data-testid="text-number-of-rows">
                      {nestingData.rows}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Algorithm</div>
                    <div className="text-lg font-semibold text-foreground" data-testid="text-algorithm-used">
                      {(nestingData as any).algorithm_used?.replace('_', ' ') || 'Simple'}
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Efficiency</div>
                    <div className="text-lg font-semibold text-foreground" data-testid="text-efficiency">
                      {(nestingData as any).efficiency_percent || '85'}%
                    </div>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Pieces Placed</div>
                    <div className="text-lg font-semibold text-foreground" data-testid="text-pieces-placed">
                      {(nestingData as any).pieces_placed?.length || 0}
                    </div>
                  </div>
                </>
              )}
              <div className="bg-accent/50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Material Usage</div>
                <div className="text-lg font-semibold text-foreground" data-testid="text-material-usage">
                  {(Number(nestingData.material_m2.i) / Math.pow(10, nestingData.material_m2.scale)).toFixed(2)} m²
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
