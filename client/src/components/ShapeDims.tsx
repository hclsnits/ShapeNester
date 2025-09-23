import { useState, useEffect } from 'react';
import { ShapeKind, ShapeDims as ShapeDimsType } from '@/types';
import { calculateArea } from '@/lib/geometry/area';
import { calculatePerimeter } from '@/lib/geometry/perimeter';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { isValidInteger } from '@/lib/numberParsing';

interface ShapeDimsProps {
  shape: ShapeKind;
  dims: ShapeDimsType;
  onDimsChange: (dims: ShapeDimsType) => void;
}

export function ShapeDims({ shape, dims, onDimsChange }: ShapeDimsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleDimChange = (key: string, value: string) => {
    const newDims = { ...dims, [key]: value };
    onDimsChange(newDims);
    
    // Validate
    const newErrors = { ...errors };
    if (value && !isValidInteger(value)) {
      newErrors[key] = 'Must be a positive integer';
    } else {
      delete newErrors[key];
    }
    
    // Shape-specific validations
    if (shape === 'triangle' && key === 'side_c') {
      const a = parseInt(newDims.side_a || '0');
      const b = parseInt(newDims.side_b || '0');
      const c = parseInt(value || '0');
      
      if (a + b <= c || a + c <= b || b + c <= a) {
        newErrors[key] = 'Triangle inequality violated';
      }
    }
    
    if (shape === 'ring') {
      const outer = parseInt(newDims.outer_diameter || '0');
      const inner = parseInt(newDims.inner_diameter || '0');
      
      if (key === 'inner_diameter' && inner >= outer) {
        newErrors[key] = 'Inner diameter must be less than outer';
      }
    }
    
    if (shape === 'oval_ring') {
      const outerMajor = parseInt(newDims.outer_major || '0');
      const outerMinor = parseInt(newDims.outer_minor || '0');
      const innerMajor = parseInt(newDims.inner_major || '0');
      const innerMinor = parseInt(newDims.inner_minor || '0');
      
      if (key.startsWith('inner_')) {
        if (innerMajor >= outerMajor || innerMinor >= outerMinor) {
          newErrors[key] = 'Inner dimensions must be less than outer';
        }
      }
    }
    
    setErrors(newErrors);
  };

  const renderDimensionFields = () => {
    switch (shape) {
      case 'rectangle':
        return (
          <>
            <DimField 
              label="Width (mm)" 
              value={dims.width || ''} 
              onChange={(v) => handleDimChange('width', v)}
              error={errors.width}
            />
            <DimField 
              label="Height (mm)" 
              value={dims.height || ''} 
              onChange={(v) => handleDimChange('height', v)}
              error={errors.height}
            />
          </>
        );
      
      case 'circle':
        return (
          <DimField 
            label="Diameter (mm)" 
            value={dims.diameter || ''} 
            onChange={(v) => handleDimChange('diameter', v)}
            error={errors.diameter}
          />
        );
      
      case 'triangle':
        return (
          <>
            <DimField 
              label="Side A (mm)" 
              value={dims.side_a || ''} 
              onChange={(v) => handleDimChange('side_a', v)}
              error={errors.side_a}
            />
            <DimField 
              label="Side B (mm)" 
              value={dims.side_b || ''} 
              onChange={(v) => handleDimChange('side_b', v)}
              error={errors.side_b}
            />
            <DimField 
              label="Side C (mm)" 
              value={dims.side_c || ''} 
              onChange={(v) => handleDimChange('side_c', v)}
              error={errors.side_c}
            />
          </>
        );
      
      case 'hexagon_flat':
        return (
          <DimField 
            label="Flat to Flat (mm)" 
            value={dims.flat_to_flat || ''} 
            onChange={(v) => handleDimChange('flat_to_flat', v)}
            error={errors.flat_to_flat}
          />
        );
      
      case 'ring':
        return (
          <>
            <DimField 
              label="Outer Diameter (mm)" 
              value={dims.outer_diameter || ''} 
              onChange={(v) => handleDimChange('outer_diameter', v)}
              error={errors.outer_diameter}
            />
            <DimField 
              label="Inner Diameter (mm)" 
              value={dims.inner_diameter || ''} 
              onChange={(v) => handleDimChange('inner_diameter', v)}
              error={errors.inner_diameter}
            />
          </>
        );
      
      case 'oval':
        return (
          <>
            <DimField 
              label="Major Axis (mm)" 
              value={dims.major_axis || ''} 
              onChange={(v) => handleDimChange('major_axis', v)}
              error={errors.major_axis}
            />
            <DimField 
              label="Minor Axis (mm)" 
              value={dims.minor_axis || ''} 
              onChange={(v) => handleDimChange('minor_axis', v)}
              error={errors.minor_axis}
            />
          </>
        );
      
      case 'oval_ring':
        return (
          <>
            <DimField 
              label="Outer Major (mm)" 
              value={dims.outer_major || ''} 
              onChange={(v) => handleDimChange('outer_major', v)}
              error={errors.outer_major}
            />
            <DimField 
              label="Outer Minor (mm)" 
              value={dims.outer_minor || ''} 
              onChange={(v) => handleDimChange('outer_minor', v)}
              error={errors.outer_minor}
            />
            <DimField 
              label="Inner Major (mm)" 
              value={dims.inner_major || ''} 
              onChange={(v) => handleDimChange('inner_major', v)}
              error={errors.inner_major}
            />
            <DimField 
              label="Inner Minor (mm)" 
              value={dims.inner_minor || ''} 
              onChange={(v) => handleDimChange('inner_minor', v)}
              error={errors.inner_minor}
            />
          </>
        );
      
      default:
        return null;
    }
  };

  const hasValidDims = Object.keys(errors).length === 0 && 
    Object.values(dims).some(v => v && parseInt(v) > 0);

  const area = hasValidDims ? calculateArea(shape, dims) : '0';
  const perimeter = hasValidDims ? calculatePerimeter(shape, dims) : '0';

  return (
    <div className="space-y-4" data-testid="shape-dims">
      <h2 className="text-lg font-semibold text-foreground">Dimensions</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {renderDimensionFields()}
      </div>
      
      <div className="rounded-lg bg-accent/50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Calculated Area:</span>
          <span className="font-medium text-foreground" data-testid="text-calculated-area">
            {Number(area).toLocaleString()} mm²
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-muted-foreground">Perimeter:</span>
          <span className="font-medium text-foreground" data-testid="text-calculated-perimeter">
            {Number(perimeter).toLocaleString()} mm
          </span>
        </div>
      </div>
    </div>
  );
}

interface DimFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function DimField({ label, value, onChange, error }: DimFieldProps) {
  const fieldKey = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'border-destructive' : ''}
        data-testid={`input-${fieldKey}`}
      />
      {error && (
        <div className="text-xs text-destructive mt-1">{error}</div>
      )}
    </div>
  );
}
