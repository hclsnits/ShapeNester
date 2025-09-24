// src/calc/nesting.ts
// Simple 0°/90° nesting based on bbox and sheet width.
// Includes kerf & spacing before bbox as requested.

import { Dec } from "./numberParsing.ts";

export interface NestingInput {
  bbox_w_mm: bigint;
  bbox_h_mm: bigint;
  sheet_width_mm: bigint;
  amount: number;
  spacing_mm: bigint; // >=0
  kerf_mm: bigint;    // >=0
}

export interface NestingResult {
  orientation: "0deg" | "90deg";
  pieces_per_row: bigint;
  rows: bigint;
  cut_width_mm: bigint;   // snijbreedte_mm
  cut_length_mm: bigint;  // snijlengte_mm
  total_length_mm: bigint;
  rest_width_mm: bigint;
  material_m2: Dec;       // mm²/1e6 (scale 6)
}

function decFromMm2(mm2: bigint): Dec {
  // mm² / 1e6  -> scale 6
  return { i: mm2, scale: 6 };
}

function layoutFor(
  w_eff: bigint, // effective width along sheet width
  h_eff: bigint, // effective height per row (feed direction)
  sheet_width_mm: bigint,
  amount: number
) {
  const ppr = sheet_width_mm / w_eff; // floor
  if (ppr < 1n) return null;
  const A = BigInt(amount);
  const rows = (A + ppr - 1n) / ppr; // ceil(amount / ppr)
  const total_len = rows * h_eff;
  const rest = sheet_width_mm - ppr * w_eff;
  return { ppr, rows, total_len, rest };
}

/** Kerf/spacing are added "before bbox". We model that as a single padding on the packed dimension. */
export function computeNesting(input: NestingInput): NestingResult {
  const { bbox_w_mm, bbox_h_mm, sheet_width_mm, amount, spacing_mm, kerf_mm } = input;
  if (!(bbox_w_mm > 0n && bbox_h_mm > 0n && sheet_width_mm > 0n)) {
    throw new Error("computeNesting: dims must be > 0");
  }
  if (amount <= 0) throw new Error("computeNesting: amount must be > 0");

  const pad = (spacing_mm > 0n ? spacing_mm : 0n) + (kerf_mm > 0n ? kerf_mm : 0n);

  // 0°: width = w+pad, length per row = h+pad
  const w0 = bbox_w_mm + pad;
  const h0 = bbox_h_mm + pad;

  // 90°: swap
  const w90 = bbox_h_mm + pad;
  const h90 = bbox_w_mm + pad;

  const L0 = layoutFor(w0, h0, sheet_width_mm, amount);
  const L90 = layoutFor(w90, h90, sheet_width_mm, amount);
  if (!L0 && !L90) throw new Error("No fit: pieces_per_row < 1 in both orientations");

  // Pick max ppr; tie-breaker: smallest cut_length (h*)
  let best: { ori: "0deg" | "90deg"; ppr: bigint; rows: bigint; total_len: bigint; rest: bigint; cw: bigint; cl: bigint; };
  const cand: Array<typeof best> = [];
  if (L0) cand.push({ ori: "0deg", ppr: L0.ppr, rows: L0.rows, total_len: L0.total_len, rest: L0.rest, cw: w0, cl: h0 });
  if (L90) cand.push({ ori: "90deg", ppr: L90.ppr, rows: L90.rows, total_len: L90.total_len, rest: L90.rest, cw: w90, cl: h90 });

  cand.sort((a, b) => {
    if (a.ppr !== b.ppr) return a.ppr > b.ppr ? -1 : 1;
    if (a.cl !== b.cl) return a.cl < b.cl ? -1 : 1; // smaller length wins
    return 0;
  });
  best = cand[0];

  // material m² = (sheet_width * total_length) / 1e6
  const mm2 = sheet_width_mm * best.total_len;
  return {
    orientation: best.ori,
    pieces_per_row: best.ppr,
    rows: best.rows,
    cut_width_mm: best.cw,
    cut_length_mm: best.cl,
    total_length_mm: best.total_len,
    rest_width_mm: best.rest,
    material_m2: decFromMm2(mm2),
  };
}
