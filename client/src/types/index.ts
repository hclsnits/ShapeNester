export type MoneyCents = bigint;

export type DecScaled = { 
  i: string; 
  scale: number; 
};

export type Material = {
  artikelcode: string;
  materiaalsoort: string;
  densiteit_g_cm3: DecScaled;
  dikte_mm: string;
  doekbreedte_mm: string;
  kleur: string;
  prijs_per_m2_cents: string;
};

export type ShapeKind =
  | "rectangle" 
  | "triangle" 
  | "hexagon_flat" 
  | "circle" 
  | "ring" 
  | "oval" 
  | "oval_ring";

export type ShapeDims = Record<string, string>;

export type NestingSummary = {
  orientation: 0 | 90;
  pieces_per_row: string;
  rows: string;
  total_length_mm: string;
  rest_width_mm: string;
  material_m2: DecScaled;
};

export type CostBreakdown = {
  base_m2: DecScaled;
  material_cost_cents: string;
  options_cost_cents: string;
  work_cost_cents: string;
  kot_cents: string;
  total_cents: string;
};

export type CartItem = {
  id: string;
  created_at: string;
  material: Material;
  shape: ShapeKind;
  dims: ShapeDims;
  amount: number;
  nesting: NestingSummary;
  costing: CostBreakdown;
};

export type BoundingBox = {
  width: string;
  height: string;
};

export type ShapeGeometry = {
  area_mm2: string;
  perimeter_mm: string;
  bbox: BoundingBox;
};
