import { PortfolioRow } from '@/lib/portfolio-parser';
import { ShapeKind, ShapeDims } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMaterialStep(selectedMaterial: PortfolioRow | null): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!selectedMaterial) {
    errors.push("Please select a material to continue");
  } else {
    if (!selectedMaterial.prijs_per_m2_cents) {
      warnings.push("Selected material has no price information");
    }
    if (!selectedMaterial.doekbreedte_mm) {
      warnings.push("Selected material has no width specification");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateShapeStep(selectedShape: ShapeKind): ValidationResult {
  // Shape selection is always valid since we have a default
  return {
    isValid: true,
    errors: [],
    warnings: []
  };
}

export function validateDimensionsStep(shape: ShapeKind, dims: ShapeDims): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredFields = getRequiredDimensionsForShape(shape);
  
  for (const field of requiredFields) {
    const value = dims[field];
    if (!value || value.trim() === '') {
      errors.push(`${getFieldDisplayName(field)} is required`);
    } else {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue <= 0) {
        errors.push(`${getFieldDisplayName(field)} must be a positive number`);
      }
    }
  }

  // Shape-specific validations
  if (shape === 'triangle' && dims.side_a && dims.side_b && dims.side_c) {
    const a = parseInt(dims.side_a || '0');
    const b = parseInt(dims.side_b || '0');
    const c = parseInt(dims.side_c || '0');
    
    if (a + b <= c || a + c <= b || b + c <= a) {
      errors.push('Triangle inequality violated - the sum of any two sides must be greater than the third side');
    }
  }

  if (shape === 'ring' && dims.outer_diameter && dims.inner_diameter) {
    const outer = parseInt(dims.outer_diameter);
    const inner = parseInt(dims.inner_diameter);
    
    if (inner >= outer) {
      errors.push('Inner diameter must be less than outer diameter');
    }
  }

  if (shape === 'oval_ring') {
    const outerMajor = parseInt(dims.outer_major || '0');
    const outerMinor = parseInt(dims.outer_minor || '0');
    const innerMajor = parseInt(dims.inner_major || '0');
    const innerMinor = parseInt(dims.inner_minor || '0');
    
    if (innerMajor >= outerMajor) {
      errors.push('Inner major axis must be less than outer major axis');
    }
    if (innerMinor >= outerMinor) {
      errors.push('Inner minor axis must be less than outer minor axis');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateOptionsStep(): ValidationResult {
  // Options are always optional, so this step is always valid
  return {
    isValid: true,
    errors: [],
    warnings: []
  };
}

function getRequiredDimensionsForShape(shape: ShapeKind): string[] {
  switch (shape) {
    case 'rectangle':
      return ['width', 'height'];
    case 'circle':
      return ['diameter'];
    case 'triangle':
      return ['side_a', 'side_b', 'side_c'];
    case 'hexagon_flat':
      return ['side_length'];
    case 'ring':
      return ['outer_diameter', 'inner_diameter'];
    case 'oval':
      return ['major_axis', 'minor_axis'];
    case 'oval_ring':
      return ['outer_major', 'outer_minor', 'inner_major', 'inner_minor'];
    default:
      return [];
  }
}

function getFieldDisplayName(field: string): string {
  const displayNames: Record<string, string> = {
    width: 'Width',
    height: 'Height',
    diameter: 'Diameter',
    side_a: 'Side A',
    side_b: 'Side B',
    side_c: 'Side C',
    side_length: 'Side Length',
    outer_diameter: 'Outer Diameter',
    inner_diameter: 'Inner Diameter',
    major_axis: 'Major Axis',
    minor_axis: 'Minor Axis',
    outer_major: 'Outer Major Axis',
    outer_minor: 'Outer Minor Axis',
    inner_major: 'Inner Major Axis',
    inner_minor: 'Inner Minor Axis'
  };
  return displayNames[field] || field;
}