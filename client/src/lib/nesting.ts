import { ShapeKind, ShapeDims, NestingSummary, BoundingBox, DecScaled } from '@/types';
import { calculateBoundingBox } from './geometry/bbox';

export interface NestingParams {
  shape: ShapeKind;
  dims: ShapeDims;
  quantity: number;
  sheetWidth: string; // mm
  spacing: string; // mm
  kerf: string; // mm
  orientation?: 0 | 90; // Optional - will auto-optimize if not provided
}

interface OptimizedNestingInput {
  bbox_w_mm: bigint;
  bbox_h_mm: bigint;
  sheet_width_mm: bigint;
  amount: number;
  spacing_mm: bigint;
  kerf_mm: bigint;
}

interface OptimizedNestingResult {
  orientation: "0deg" | "90deg";
  pieces_per_row: bigint;
  rows: bigint;
  cut_width_mm: bigint;
  cut_length_mm: bigint;
  total_length_mm: bigint;
  rest_width_mm: bigint;
  material_m2: DecScaled;
}

function decFromMm2(mm2_scaled: bigint): DecScaled {
  // Convert from tenth-mm² to m² with scale 6
  // tenth-mm × tenth-mm = 100th-mm², so divide by 100 to get mm², then divide by 1e6 to get m²
  // Total scale factor: 1e8 = 100 * 1e6
  const m2_value = mm2_scaled / BigInt(100); // Convert 100th-mm² to mm²
  return { i: m2_value.toString(), scale: 6 }; // Then scale 6 converts mm² to m²
}

function layoutFor(
  w_eff: bigint, // effective width along sheet width
  h_eff: bigint, // effective height per row (feed direction)
  sheet_width_mm: bigint,
  amount: number
) {
  const ppr = sheet_width_mm / w_eff; // floor division
  if (ppr < BigInt(1)) return null;
  
  const A = BigInt(amount);
  const rows = (A + ppr - BigInt(1)) / ppr; // ceil(amount / ppr)
  const total_len = rows * h_eff;
  const rest = sheet_width_mm - ppr * w_eff;
  
  return { ppr, rows, total_len, rest };
}

function computeOptimizedNesting(input: OptimizedNestingInput): OptimizedNestingResult {
  const { bbox_w_mm, bbox_h_mm, sheet_width_mm, amount, spacing_mm, kerf_mm } = input;
  
  if (!(bbox_w_mm > BigInt(0) && bbox_h_mm > BigInt(0) && sheet_width_mm > BigInt(0))) {
    throw new Error("computeNesting: dims must be > 0");
  }
  if (amount <= 0) throw new Error("computeNesting: amount must be > 0");

  const pad = (spacing_mm > BigInt(0) ? spacing_mm : BigInt(0)) + (kerf_mm > BigInt(0) ? kerf_mm : BigInt(0));

  // 0°: width = w+pad, length per row = h+pad
  const w0 = bbox_w_mm + pad;
  const h0 = bbox_h_mm + pad;

  // 90°: swap dimensions
  const w90 = bbox_h_mm + pad;
  const h90 = bbox_w_mm + pad;

  const L0 = layoutFor(w0, h0, sheet_width_mm, amount);
  const L90 = layoutFor(w90, h90, sheet_width_mm, amount);
  
  if (!L0 && !L90) throw new Error("No fit: pieces_per_row < 1 in both orientations");

  // Pick max pieces per row; tie-breaker: smallest cut_length
  type LayoutCandidate = {
    ori: "0deg" | "90deg";
    ppr: bigint;
    rows: bigint;
    total_len: bigint;
    rest: bigint;
    cw: bigint;
    cl: bigint;
  };
  
  const candidates: LayoutCandidate[] = [];
  if (L0) candidates.push({ ori: "0deg", ppr: L0.ppr, rows: L0.rows, total_len: L0.total_len, rest: L0.rest, cw: w0, cl: h0 });
  if (L90) candidates.push({ ori: "90deg", ppr: L90.ppr, rows: L90.rows, total_len: L90.total_len, rest: L90.rest, cw: w90, cl: h90 });

  candidates.sort((a, b) => {
    if (a.ppr !== b.ppr) return a.ppr > b.ppr ? -1 : 1; // Higher pieces per row wins
    if (a.cl !== b.cl) return a.cl < b.cl ? -1 : 1; // Smaller cut length wins
    return 0;
  });
  
  const best = candidates[0];

  // material area: sheet_width (tenth-mm) × total_length (tenth-mm) = 100th-mm²
  const mm2_scaled = sheet_width_mm * best.total_len;
  
  return {
    orientation: best.ori,
    pieces_per_row: best.ppr,
    rows: best.rows,
    cut_width_mm: best.cw / BigInt(10), // Scale back to mm
    cut_length_mm: best.cl / BigInt(10), // Scale back to mm
    total_length_mm: best.total_len / BigInt(10), // Scale back to mm
    rest_width_mm: best.rest / BigInt(10), // Scale back to mm
    material_m2: decFromMm2(mm2_scaled),
  };
}

export function calculateNesting(params: NestingParams): NestingSummary {
  const bbox = calculateBoundingBox(params.shape, params.dims);
  
  // Convert inputs to BigInt with tenth-mm precision for accuracy
  // bbox.width/height and params.* are string-typed in this codebase.
  // Safely parse them to numbers, scale to tenth-mm and convert to BigInt.
  const toTenth = (v: string | number) => BigInt(Math.round(Number(v) * 10));

  const bbox_w_mm = toTenth(bbox.width); // Scale to tenth-mm
  const bbox_h_mm = toTenth(bbox.height); // Scale to tenth-mm
  const sheet_width_mm = toTenth(params.sheetWidth); // Scale to tenth-mm
  const spacing_mm = toTenth(params.spacing); // 1.5mm -> 15 tenth-mm
  const kerf_mm = toTenth(params.kerf); // 1.5mm -> 15 tenth-mm
  
  try {
    // Use optimized algorithm unless specific orientation is requested
    if (params.orientation !== undefined) {
      // Legacy mode: respect user's orientation choice
      const pad = spacing_mm + kerf_mm;
      const effectiveWidth = params.orientation === 90 ? bbox_h_mm + pad : bbox_w_mm + pad;
      const effectiveHeight = params.orientation === 90 ? bbox_w_mm + pad : bbox_h_mm + pad;
      
      const layout = layoutFor(effectiveWidth, effectiveHeight, sheet_width_mm, params.quantity);
      if (!layout) {
        // Part doesn't fit
        return {
          orientation: params.orientation,
          pieces_per_row: "0",
          rows: "0",
          total_length_mm: "0",
          rest_width_mm: params.sheetWidth,
          material_m2: { i: "0", scale: 6 }
        };
      }
      
      const mm2_scaled = sheet_width_mm * layout.total_len;
      return {
        orientation: params.orientation,
        pieces_per_row: layout.ppr.toString(),
        rows: layout.rows.toString(),
        total_length_mm: (layout.total_len / BigInt(10)).toString(), // Scale back to mm
        rest_width_mm: (layout.rest / BigInt(10)).toString(), // Scale back to mm
        material_m2: decFromMm2(mm2_scaled)
      };
    } else {
      // Auto-optimize orientation
      const result = computeOptimizedNesting({
        bbox_w_mm,
        bbox_h_mm,
        sheet_width_mm,
        amount: params.quantity,
        spacing_mm,
        kerf_mm
      });
      
      return {
        orientation: result.orientation === "0deg" ? 0 : 90,
        pieces_per_row: result.pieces_per_row.toString(),
        rows: result.rows.toString(),
        total_length_mm: result.total_length_mm.toString(),
        rest_width_mm: result.rest_width_mm.toString(),
        material_m2: result.material_m2
      };
    }
  } catch (error) {
    // Fallback for any calculation errors
    return {
      orientation: params.orientation || 0,
      pieces_per_row: "0",
      rows: "0",
      total_length_mm: "0",
      rest_width_mm: params.sheetWidth,
      material_m2: { i: "0", scale: 6 }
    };
  }
}
