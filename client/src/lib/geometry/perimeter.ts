import { ShapeKind, ShapeDims } from '@/types';

export function calculatePerimeter(shape: ShapeKind, dims: ShapeDims): string {
  switch (shape) {
    case "rectangle":
      const w = BigInt(dims.width || "0");
      const h = BigInt(dims.height || "0");
      return (BigInt(2) * (w + h)).toString();
    
    case "circle":
      const d = BigInt(dims.diameter || "0");
      // π ≈ 3141592653589793 / 1000000000000000
      const piNumerator = BigInt("3141592653589793");
      const piDenominator = BigInt("1000000000000000");
      return (d * piNumerator / piDenominator).toString();
    
    case "triangle":
      const triangleA = BigInt(dims.side_a || "0");
      const triangleB = BigInt(dims.side_b || "0");
      const triangleC = BigInt(dims.side_c || "0");
      return (triangleA + triangleB + triangleC).toString();
    
    case "hexagon_flat":
      const f = BigInt(dims.flat_to_flat || "0");
      const side = f * BigInt(577) / BigInt(1000); // f / sqrt(3)
      return (side * BigInt(6)).toString();
    
    case "ring":
      const od = BigInt(dims.outer_diameter || "0");
      const id = BigInt(dims.inner_diameter || "0");
      const piNum = BigInt("3141592653589793");
      const piDen = BigInt("1000000000000000");
      const outerPerimeter = od * piNum / piDen;
      const innerPerimeter = id * piNum / piDen;
      return (outerPerimeter + innerPerimeter).toString();
    
    case "oval":
      // Convert full axes to semi-axes (radii) for Ramanujan formula
      const ovalSemiA = BigInt(dims.major_axis || "0") / BigInt(2);
      const ovalSemiB = BigInt(dims.minor_axis || "0") / BigInt(2);
      // Ramanujan approximation: π[3(a+b) - sqrt((3a+b)(a+3b))]
      const pi = BigInt("3141592653589793");
      const piDiv = BigInt("1000000000000000");
      const term1 = BigInt(3) * (ovalSemiA + ovalSemiB);
      const term2a = BigInt(3) * ovalSemiA + ovalSemiB;
      const term2b = ovalSemiA + BigInt(3) * ovalSemiB;
      const sqrtTerm = approximateSquareRoot(term2a * term2b);
      const approximation = term1 - sqrtTerm;
      return (approximation * pi / piDiv).toString();
    
    case "oval_ring":
      // Sum of outer and inner perimeters
      // Convert full axes to semi-axes (radii) for calculations
      const outerSemiA = BigInt(dims.outer_major || "0") / BigInt(2);
      const outerSemiB = BigInt(dims.outer_minor || "0") / BigInt(2);
      const innerSemiA = BigInt(dims.inner_major || "0") / BigInt(2);
      const innerSemiB = BigInt(dims.inner_minor || "0") / BigInt(2);
      
      const outerPerim = calculateOvalPerimeter(outerSemiA, outerSemiB);
      const innerPerim = calculateOvalPerimeter(innerSemiA, innerSemiB);
      return (outerPerim + innerPerim).toString();
    
    default:
      return "0";
  }
}

function calculateOvalPerimeter(ovalMajor: bigint, ovalMinor: bigint): bigint {
  const pi = BigInt("3141592653589793");
  const piDiv = BigInt("1000000000000000");
  const term1 = BigInt(3) * (ovalMajor + ovalMinor);
  const term2a = BigInt(3) * ovalMajor + ovalMinor;
  const term2b = ovalMajor + BigInt(3) * ovalMinor;
  const sqrtTerm = approximateSquareRoot(term2a * term2b);
  const approximation = term1 - sqrtTerm;
  return approximation * pi / piDiv;
}

function approximateSquareRoot(n: bigint): bigint {
  if (n === BigInt(0)) return BigInt(0);
  if (n === BigInt(1)) return BigInt(1);
  
  let x = n;
  let y = (x + BigInt(1)) / BigInt(2);
  
  while (y < x) {
    x = y;
    y = (x + n / x) / BigInt(2);
  }
  
  return x;
}
