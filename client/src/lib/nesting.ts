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
  // Convert decimal spacing and kerf to integers (in tenths of mm for precision)
  const spacingBig = BigInt(Math.round(parseFloat(params.spacing) * 10));
  const kerfBig = BigInt(Math.round(parseFloat(params.kerf) * 10));
  const effectiveWidth = BigInt(effectiveBbox.width) * BigInt(10) + spacingBig + kerfBig;
  const effectiveHeight = BigInt(effectiveBbox.height) * BigInt(10) + spacingBig + kerfBig;
  
  // Calculate pieces per row (convert sheet width to tenths for comparison)
  const sheetWidthTenths = sheetWidthBig * BigInt(10);
  
  // Check if part fits on sheet width
  if (effectiveWidth <= BigInt(0) || sheetWidthTenths < effectiveWidth) {
    // Part doesn't fit - return zero layout
    return {
      orientation: params.orientation,
      pieces_per_row: "0",
      rows: "0", 
      total_length_mm: "0",
      rest_width_mm: params.sheetWidth,
      material_m2: { i: "0", scale: 6 }
    };
  }
  
  const piecesPerRow = sheetWidthTenths / effectiveWidth;
  
  // Calculate number of rows needed
  const quantityBig = BigInt(params.quantity);
  const rows = (quantityBig + piecesPerRow - BigInt(1)) / piecesPerRow; // Ceiling division
  
  // Calculate total length (convert back from tenths to mm)
  const totalLength = rows * effectiveHeight / BigInt(10);
  
  // Calculate rest width (unused width in each row, convert back to mm)
  const restWidth = sheetWidthTenths - (piecesPerRow * effectiveWidth);
  const restWidthMm = restWidth / BigInt(10);
  
  // Calculate material usage in m²
  const materialMm2 = sheetWidthBig * totalLength;
  const materialM2 = mmToM2(materialMm2.toString());
  
  return {
    orientation: params.orientation,
    pieces_per_row: piecesPerRow.toString(),
    rows: rows.toString(),
    total_length_mm: totalLength.toString(),
    rest_width_mm: restWidthMm.toString(),
    material_m2: materialM2
  };
}
