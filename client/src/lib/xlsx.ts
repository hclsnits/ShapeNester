import * as XLSX from 'xlsx';
import { CartItem } from '@/types';
import { downloadBlob } from './download';
import { formatCentsEUR, centsToEuros } from './money';

export function exportCartToXLSX(cart: CartItem[]): void {
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for the spreadsheet
  const data = cart.map((item, index) => ({
    'Item': index + 1,
    'Article Code': item.material.artikelcode,
    'Material': `${item.material.materiaalsoort} ${item.material.kleur}`,
    'Thickness (mm)': item.material.dikte_mm,
    'Shape': item.shape,
    'Dimensions': getDimensionsText(item.shape, item.dims),
    'Quantity': item.amount,
    'Material Cost': formatCentsEUR(BigInt(item.costing.material_cost_cents)),
    'Work Cost': formatCentsEUR(BigInt(item.costing.work_cost_cents)),
    'Options Cost': formatCentsEUR(BigInt(item.costing.options_cost_cents)),
    'Setup Fee': formatCentsEUR(BigInt(item.costing.kot_cents)),
    'Total': formatCentsEUR(BigInt(item.costing.total_cents)),
  }));
  
  // Add summary row
  const totalCost = cart.reduce((sum, item) => sum + centsToEuros(item.costing.total_cents), 0);
  data.push({
    'Item': '' as any,
    'Article Code': '',
    'Material': '',
    'Thickness (mm)': '',
    'Shape': '' as any,
    'Dimensions': '',
    'Quantity': '' as any,
    'Material Cost': '',
    'Work Cost': '',
    'Options Cost': '',
    'Setup Fee': 'TOTAL:',
    'Total': formatCentsEUR(BigInt(Math.round(totalCost * 100))),
  });
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Quote');
  
  const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const timestamp = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `snijtool-quote-${timestamp}.xlsx`);
}

function getDimensionsText(shape: string, dims: Record<string, string>): string {
  switch (shape) {
    case 'rectangle':
      return `${dims.width}×${dims.height}mm`;
    case 'circle':
      return `Ø${dims.diameter}mm`;
    case 'triangle':
      return `${dims.side_a}×${dims.side_b}×${dims.side_c}mm`;
    case 'hexagon_flat':
      return `F2F: ${dims.flat_to_flat}mm`;
    case 'ring':
      return `OD:${dims.outer_diameter}mm ID:${dims.inner_diameter}mm`;
    case 'oval':
      return `${dims.major_axis}×${dims.minor_axis}mm`;
    case 'oval_ring':
      return `O:${dims.outer_major}×${dims.outer_minor}mm I:${dims.inner_major}×${dims.inner_minor}mm`;
    default:
      return '';
  }
}
