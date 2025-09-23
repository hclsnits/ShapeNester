import { ShapeKind, ShapeDims, BoundingBox } from '@/types';

export function calculateBoundingBox(shape: ShapeKind, dims: ShapeDims): BoundingBox {
  switch (shape) {
    case "rectangle":
      return {
        width: dims.width || "0",
        height: dims.height || "0"
      };
    
    case "circle":
      return {
        width: dims.diameter || "0",
        height: dims.diameter || "0"
      };
    
    case "triangle":
      // For triangle, we approximate the bounding box
      // This is a simple approximation - in practice you'd calculate the exact bbox
      const a = BigInt(dims.side_a || "0");
      const b = BigInt(dims.side_b || "0");
      const c = BigInt(dims.side_c || "0");
      const maxSide = a > b ? (a > c ? a : c) : (b > c ? b : c);
      
      // Approximate height using the largest side as base
      const s = (a + b + c) / BigInt(2);
      const areaSquared = s * (s - a) * (s - b) * (s - c);
      
      // Simple approximation for bounding box
      return {
        width: maxSide.toString(),
        height: (maxSide * BigInt(3) / BigInt(4)).toString() // Approximate height
      };
    
    case "hexagon_flat":
      const f = BigInt(dims.flat_to_flat || "0");
      const side = f * BigInt(577) / BigInt(1000); // f / sqrt(3) ≈ f * 0.577
      return {
        width: f.toString(),
        height: (side * BigInt(2)).toString()
      };
    
    case "ring":
      return {
        width: dims.outer_diameter || "0",
        height: dims.outer_diameter || "0"
      };
    
    case "oval":
      return {
        width: (BigInt(dims.major_axis || "0") * BigInt(2)).toString(),
        height: (BigInt(dims.minor_axis || "0") * BigInt(2)).toString()
      };
    
    case "oval_ring":
      return {
        width: (BigInt(dims.outer_major || "0") * BigInt(2)).toString(),
        height: (BigInt(dims.outer_minor || "0") * BigInt(2)).toString()
      };
    
    default:
      return { width: "0", height: "0" };
  }
}
