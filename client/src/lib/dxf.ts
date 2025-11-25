// Minimal DXF exporter for shapes — produces ASCII R12 DXF with POLYLINE/VERTEX entities
// All coordinates are in millimeters. Curves (circle/oval/rings) are approximated as polylines.

export interface DxfExportOptions {
  segments?: number; // curve approximation segments
  normalize?: boolean; // translate to bbox origin (minX,minY -> 0,0)
  align?: "bbox_origin" | "none"; // alignment method (currently supports bbox_origin)
  layer?: string | null;
}

function dxfHeader(): string {
  return [
    "0",
    "SECTION",
    "2",
    "HEADER",
    "0",
    "ENDSEC",
    "0",
    "SECTION",
    "2",
    "ENTITIES",
  ].join("\n") + "\n";
}

function dxfFooter(): string {
  return ["0", "ENDSEC", "0", "EOF"].join("\n") + "\n";
}

function polylineToDxf(entityLayer: string | null, points: Array<[number, number]>) {
  // Use POLYLINE + VERTEX + SEQEND for broad compatibility
  const layer = entityLayer || "0";
  const lines: string[] = [];
  lines.push("0", "POLYLINE");
  lines.push("8", layer);
  // 66 indicates vertex follow
  lines.push("66", "1");
  // 70 = 1 means closed polyline
  lines.push("70", "1");

  for (const [x, y] of points) {
    lines.push("0", "VERTEX");
    lines.push("8", layer);
    // DXF uses X (10) and Y (20)
    lines.push("10", trimNum(x));
    lines.push("20", trimNum(y));
  }

  lines.push("0", "SEQEND");
  return lines.join("\n") + "\n";
}

function trimNum(n: number) {
  // keep 4 decimals to be safe
  return (+n.toFixed(4)).toString();
}

// Approximations
function circlePoints(cx: number, cy: number, r: number, segments = 64): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * 2 * Math.PI;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function ellipsePoints(cx: number, cy: number, rx: number, ry: number, segments = 64): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * 2 * Math.PI;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

export type ShapeKind =
  | "rectangle"
  | "triangle"
  | "hexagon_flat"
  | "circle"
  | "ring"
  | "oval"
  | "oval_ring";

export type ShapeDims = Record<string, string>;

// returns array of polylines; each polyline is an array of [x,y]
export function shapeToPolylines(shape: ShapeKind, dims: ShapeDims, segments = 64): Array<Array<[number, number]>> {
  switch (shape) {
    case "rectangle": {
      const w = Number(dims.width || 0);
      const h = Number(dims.height || 0);
      return [[[0, 0], [w, 0], [w, h], [0, h]]];
    }
    case "circle": {
      const d = Number(dims.diameter || 0);
      const r = d / 2;
      return [circlePoints(r, r, r, segments)];
    }
    case "ring": {
      const outer = Number(dims.outer_diameter || 0);
      const inner = Number(dims.inner_diameter || 0);
      const rOut = outer / 2;
      const rIn = inner / 2;
      // center both at (rOut, rOut)
      const outerPts = circlePoints(rOut, rOut, rOut, segments);
      const innerPts = circlePoints(rOut, rOut, rIn, segments);
      return [outerPts, innerPts];
    }
    case "oval": {
      const rx = Number(dims.major_axis || 0) / 2;
      const ry = Number(dims.minor_axis || 0) / 2;
      return [ellipsePoints(rx, ry, rx, ry, segments)];
    }
    case "oval_ring": {
      const outerMajor = Number(dims.outer_major || 0) / 2;
      const outerMinor = Number(dims.outer_minor || 0) / 2;
      const innerMajor = Number(dims.inner_major || 0) / 2;
      const innerMinor = Number(dims.inner_minor || 0) / 2;
      const outer = ellipsePoints(outerMajor, outerMinor, outerMajor, outerMinor, segments);
      const inner = ellipsePoints(outerMajor, outerMinor, innerMajor, innerMinor, segments);
      return [outer, inner];
    }
    case "triangle": {
      const a = Number(dims.side_a || 0);
      const b = Number(dims.side_b || 0);
      const c = Number(dims.side_c || 0);
      // place base along x-axis from (0,0) to (c,0), compute apex using law of cos
      // assume sides a = BC, b = AC, c = AB (c is base)
      const xA = 0;
      const yA = 0;
      const xB = c;
      const yB = 0;
      // solve for coordinates of C using lengths a (between B and C) and b (between A and C)
      // using formula: x = (b^2 + c^2 - a^2) / (2c)
      const xC = (b * b + c * c - a * a) / (2 * c);
      const yC = Math.sqrt(Math.max(0, b * b - xC * xC));
      return [[[xA, yA], [xB, yB], [xC, yC]]];
    }
    case "hexagon_flat": {
      const flat = Number(dims.flat_to_flat || 0); // flat-to-flat width
      const w = flat;
      const h = (Math.sqrt(3) / 2) * w; // approximate height for regular hexagon
      const pts: Array<[number, number]> = [
        [w * 0.5, 0],
        [w, h * 0.25],
        [w, h * 0.75],
        [w * 0.5, h],
        [0, h * 0.75],
        [0, h * 0.25],
      ];
      return [pts];
    }
    default:
      return [];
  }
}

// Normalize polylines so minX,minY -> 0,0
function normalizePolylines(polylines: Array<Array<[number, number]>>) {
  let minX = Infinity;
  let minY = Infinity;
  for (const poly of polylines) {
    for (const [x, y] of poly) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
    }
  }
  if (!isFinite(minX) || !isFinite(minY)) return polylines;
  if (minX === 0 && minY === 0) return polylines;
  return polylines.map((poly) => poly.map(([x, y]) => [x - minX, y - minY] as [number, number]));
}

// High-level exporter: returns DXF content (ASCII) for a single shape as polylines
export function exportShapeToDxf(shape: ShapeKind, dims: ShapeDims, options: DxfExportOptions = {}): string {
  const segments = options.segments ?? 64;
  const polylines = shapeToPolylines(shape, dims, segments);
  const normalized = options.normalize || options.align === "bbox_origin" ? normalizePolylines(polylines) : polylines;
  const out: string[] = [];
  out.push(dxfHeader());
  for (const poly of normalized) {
    out.push(polylineToDxf(options.layer || "0", poly));
  }
  out.push(dxfFooter());
  return out.join("");
}

// Browser helper to trigger download
export function downloadDxf(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default exportShapeToDxf;
