import { useState, useMemo } from 'react';
import { ShapeKind, ShapeDims, Material } from '@/types';
import { calculateBoundingBox } from '@/lib/geometry/bbox';
import { calculateNesting } from '@/lib/nesting';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NestingPreviewProps {
  shape: ShapeKind;
  dims: ShapeDims;
  material: Material | null;
}

export function NestingPreview({ shape, dims, material }: NestingPreviewProps) {
  const [quantity, setQuantity] = useState(20);
  const [spacing, setSpacing] = useState(5);
  const [kerf, setKerf] = useState(1.5);
  const [orientation, setOrientation] = useState<0 | 90>(0);

  const hasValidDims = Object.values(dims).some(v => v && parseInt(v) > 0);
  
  const nestingData = useMemo(() => {
    if (!material || !hasValidDims) return null;
    
    return calculateNesting({
      shape,
      dims,
      quantity,
      sheetWidth: material.doekbreedte_mm,
      spacing: spacing.toString(),
      kerf: kerf.toString(),
      orientation
    });
  }, [shape, dims, material, quantity, spacing, kerf, orientation, hasValidDims]);

  const bbox = hasValidDims ? calculateBoundingBox(shape, dims) : null;

  const renderShapeOutline = () => {
    if (!bbox) return null;
    
    const width = Math.min(parseInt(bbox.width), 100);
    const height = Math.min(parseInt(bbox.height), 60);
    const scale = Math.min(100 / parseInt(bbox.width), 60 / parseInt(bbox.height));
    const scaledWidth = parseInt(bbox.width) * scale;
    const scaledHeight = parseInt(bbox.height) * scale;

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
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          <div>
            <Label className="text-sm font-medium mb-2 block">Orientation</Label>
            <Select 
              value={orientation.toString()} 
              onValueChange={(value) => setOrientation(value === '90' ? 90 : 0)}
            >
              <SelectTrigger data-testid="select-orientation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0° (Normal)</SelectItem>
                <SelectItem value="90">90° (Rotated)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {nestingData && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="bg-accent/50 rounded-lg p-3">
              <div className="text-sm text-muted-foreground">Material Usage</div>
              <div className="text-lg font-semibold text-foreground" data-testid="text-material-usage">
                {(Number(nestingData.material_m2.i) / Math.pow(10, nestingData.material_m2.scale)).toFixed(2)} m²
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
