import { ShapeKind, ShapeDims } from '@/types';

export function calculateArea(shape: ShapeKind, dims: ShapeDims): string {
  switch (shape) {
    case "rectangle":
      const w = BigInt(dims.width || "0");
      const h = BigInt(dims.height || "0");
      return (w * h).toString();
    
    case "circle":
      const d = BigInt(dims.diameter || "0");
      const r = d / BigInt(2);
      // π ≈ 3141592653589793 / 1000000000000000
      const piNumerator = BigInt("3141592653589793");
      const piDenominator = BigInt("1000000000000000");
      return (r * r * piNumerator / piDenominator).toString();
    
    case "triangle":
      const a = BigInt(dims.side_a || "0");
      const b = BigInt(dims.side_b || "0");
      const c = BigInt(dims.side_c || "0");
      
      // Heron's formula: area = sqrt(s(s-a)(s-b)(s-c)) where s = (a+b+c)/2
      const s = (a + b + c) / BigInt(2);
      const underRoot = s * (s - a) * (s - b) * (s - c);
      
      // Approximate square root using binary search
      const area = approximateSquareRoot(underRoot);
      return area.toString();
    
    case "hexagon_flat":
      const f = BigInt(dims.flat_to_flat || "0");
      const side = f * BigInt(577) / BigInt(1000); // f / sqrt(3)
      // Area = (3√3/2) * s² = 2.598... * s²
      const factor = BigInt("2598076211353316");
      const denominator = BigInt("1000000000000000");
      return (factor * side * side / denominator).toString();
    
    case "ring":
      const od = BigInt(dims.outer_diameter || "0");
      const id = BigInt(dims.inner_diameter || "0");
      const outerR = od / BigInt(2);
      const innerR = id / BigInt(2);
      const piNum = BigInt("3141592653589793");
      const piDen = BigInt("1000000000000000");
      const outerArea = outerR * outerR * piNum / piDen;
      const innerArea = innerR * innerR * piNum / piDen;
      return (outerArea - innerArea).toString();
    
    case "oval":
      // Convert full axes to semi-axes (radii) for area calculation: π * a * b
      const semiA = BigInt(dims.major_axis || "0") / BigInt(2);
      const semiB = BigInt(dims.minor_axis || "0") / BigInt(2);
      const piN = BigInt("3141592653589793");
      const piD = BigInt("1000000000000000");
      return (semiA * semiB * piN / piD).toString();
    
    case "oval_ring":
      // Convert full axes to semi-axes (radii) for area calculations
      const outerSemiMajor = BigInt(dims.outer_major || "0") / BigInt(2);
      const outerSemiMinor = BigInt(dims.outer_minor || "0") / BigInt(2);
      const innerSemiMajor = BigInt(dims.inner_major || "0") / BigInt(2);
      const innerSemiMinor = BigInt(dims.inner_minor || "0") / BigInt(2);
      const pi = BigInt("3141592653589793");
      const piDiv = BigInt("1000000000000000");
      const outerOvalArea = outerSemiMajor * outerSemiMinor * pi / piDiv;
      const innerOvalArea = innerSemiMajor * innerSemiMinor * pi / piDiv;
      return (outerOvalArea - innerOvalArea).toString();
    
    default:
      return "0";
  }
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
