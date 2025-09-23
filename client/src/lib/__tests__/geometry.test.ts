import { describe, it, expect } from 'vitest';
import { calculateArea } from '../geometry/area';
import { calculatePerimeter } from '../geometry/perimeter';
import { calculateBoundingBox } from '../geometry/bbox';

describe('Geometry Calculations', () => {
  describe('Rectangle', () => {
    it('should calculate area correctly', () => {
      const area = calculateArea('rectangle', { width: '100', height: '200' });
      expect(area).toBe('20000');
    });

    it('should calculate perimeter correctly', () => {
      const perimeter = calculatePerimeter('rectangle', { width: '100', height: '200' });
      expect(perimeter).toBe('600');
    });

    it('should calculate bounding box correctly', () => {
      const bbox = calculateBoundingBox('rectangle', { width: '100', height: '200' });
      expect(bbox).toEqual({ width: '100', height: '200' });
    });
  });

  describe('Circle', () => {
    it('should calculate area correctly', () => {
      const area = calculateArea('circle', { diameter: '100' });
      // π * (50)² ≈ 7853.98...
      const result = parseInt(area);
      expect(result).toBeGreaterThan(7800);
      expect(result).toBeLessThan(7900);
    });

    it('should calculate perimeter correctly', () => {
      const perimeter = calculatePerimeter('circle', { diameter: '100' });
      // π * 100 ≈ 314.15...
      const result = parseInt(perimeter);
      expect(result).toBeGreaterThan(310);
      expect(result).toBeLessThan(320);
    });
  });

  describe('Triangle', () => {
    it('should calculate area correctly for valid triangle', () => {
      const area = calculateArea('triangle', { side_a: '3', side_b: '4', side_c: '5' });
      // This is a right triangle with area = 0.5 * 3 * 4 = 6
      // Using Heron's formula should give approximately 6
      const result = parseInt(area);
      expect(result).toBeGreaterThan(5);
      expect(result).toBeLessThan(7);
    });

    it('should calculate perimeter correctly', () => {
      const perimeter = calculatePerimeter('triangle', { side_a: '3', side_b: '4', side_c: '5' });
      expect(perimeter).toBe('12');
    });
  });
});
