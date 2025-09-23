import { ShapeKind, ShapeDims, NestingSummary, BoundingBox } from '@/types';
import { calculateBoundingBox } from './geometry/bbox';
import { mmToM2 } from './units';

export interface NestingParams {
  shape: ShapeKind;
  dims: ShapeDims;
  quantity: number;
  sheetWidth: string; // mm
  spacing: string; // mm
  kerf: string; // mm
  orientation: 0 | 90;
}

export function calculateNesting(params: NestingParams): NestingSummary {
  const bbox = calculateBoundingBox(params.shape, params.dims);
  
  // Apply orientation
  const effectiveBbox: BoundingBox = params.orientation === 90 
    ? { width: bbox.height, height: bbox.width }
    : bbox;
  
  const sheetWidthBig = BigInt(params.sheetWidth);
  const spacingBig = BigInt(params.spacing);
  const kerfBig = BigInt(params.kerf);
  const effectiveWidth = BigInt(effectiveBbox.width) + spacingBig + kerfBig;
  const effectiveHeight = BigInt(effectiveBbox.height) + spacingBig + kerfBig;
  
  // Calculate pieces per row
  const piecesPerRow = sheetWidthBig >= effectiveWidth 
    ? sheetWidthBig / effectiveWidth 
    : BigInt(1);
  
  // Calculate number of rows needed
  const quantityBig = BigInt(params.quantity);
  const rows = (quantityBig + piecesPerRow - BigInt(1)) / piecesPerRow; // Ceiling division
  
  // Calculate total length
  const totalLength = rows * effectiveHeight;
  
  // Calculate rest width (unused width in each row)
  const restWidth = sheetWidthBig - (piecesPerRow * effectiveWidth);
  
  // Calculate material usage in m²
  const materialMm2 = sheetWidthBig * totalLength;
  const materialM2 = mmToM2(materialMm2.toString());
  
  return {
    orientation: params.orientation,
    pieces_per_row: piecesPerRow.toString(),
    rows: rows.toString(),
    total_length_mm: totalLength.toString(),
    rest_width_mm: restWidth.toString(),
    material_m2: materialM2
  };
}
