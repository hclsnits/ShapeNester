import { describe, it, expect } from 'vitest';
import { calculateNesting } from '../nesting';

describe('Nesting Calculations', () => {
  it('should calculate basic nesting correctly', () => {
    const result = calculateNesting({
      shape: 'rectangle',
      dims: { width: '100', height: '50' },
      quantity: 10,
      sheetWidth: '1000',
      spacing: '5',
      kerf: '1',
      orientation: 0
    });

    // With 100mm + 5mm + 1mm = 106mm effective width
    // 1000mm / 106mm = 9 pieces per row (floor)
    expect(result.pieces_per_row).toBe('9');
    
    // 10 pieces / 9 per row = 2 rows (ceiling)
    expect(result.rows).toBe('2');
    
    // Total length = 2 rows * (50mm + 5mm + 1mm) = 112mm
    expect(result.total_length_mm).toBe('112');
  });

  it('should handle 90 degree orientation', () => {
    const result = calculateNesting({
      shape: 'rectangle',
      dims: { width: '100', height: '50' },
      quantity: 10,
      sheetWidth: '1000',
      spacing: '5',
      kerf: '1',
      orientation: 90
    });

    // With 90 degree rotation: 50mm + 5mm + 1mm = 56mm effective width
    // 1000mm / 56mm = 17 pieces per row (floor)
    expect(result.pieces_per_row).toBe('17');
    
    // 10 pieces / 17 per row = 1 row (ceiling)
    expect(result.rows).toBe('1');
  });

  it('should calculate material usage correctly', () => {
    const result = calculateNesting({
      shape: 'rectangle',
      dims: { width: '100', height: '50' },
      quantity: 1,
      sheetWidth: '1000',
      spacing: '0',
      kerf: '0',
      orientation: 0
    });

    // Material usage = 1000mm * 50mm = 50,000 mm²
    // In m² with scale 6: 50,000 / 1,000,000 = 0.05 m²
    expect(result.material_m2.i).toBe('50000');
    expect(result.material_m2.scale).toBe(6);
  });
});
