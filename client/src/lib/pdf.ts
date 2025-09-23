import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CartItem } from '@/types';
import { downloadBlob } from './download';
import { formatCentsEUR, centsToEuros } from './money';

export async function exportCartToPDF(cart: CartItem[]): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  let yPosition = height - 50;
  
  // Header
  page.drawText('Snijtool v2 - Quote', {
    x: 50,
    y: yPosition,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 30;
  page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
    x: 50,
    y: yPosition,
    size: 12,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  yPosition -= 40;
  
  // Items
  for (let i = 0; i < cart.length; i++) {
    const item = cart[i];
    
    // Item header
    page.drawText(`${i + 1}. ${item.material.artikelcode} - ${item.shape.toUpperCase()}`, {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 20;
    
    // Material info
    page.drawText(`Material: ${item.material.materiaalsoort} ${item.material.kleur}, ${item.material.dikte_mm}mm`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 15;
    
    // Dimensions
    const dimsText = getDimensionsText(item.shape, item.dims);
    page.drawText(`Dimensions: ${dimsText}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 15;
    
    // Quantity and nesting
    page.drawText(`Quantity: ${item.amount} pieces`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    yPosition -= 15;
    
    // Cost breakdown
    page.drawText(`Material: ${formatCentsEUR(BigInt(item.costing.material_cost_cents))}`, {
      x: 70,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText(`Work: ${formatCentsEUR(BigInt(item.costing.work_cost_cents))}`, {
      x: 200,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText(`Options: ${formatCentsEUR(BigInt(item.costing.options_cost_cents))}`, {
      x: 320,
      y: yPosition,
      size: 10,
      font: font,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    page.drawText(`Total: ${formatCentsEUR(BigInt(item.costing.total_cents))}`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 30;
    
    // Add new page if needed
    if (yPosition < 100 && i < cart.length - 1) {
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }
  }
  
  // Total
  const totalCost = cart.reduce((sum, item) => sum + centsToEuros(item.costing.total_cents), 0);
  
  yPosition -= 20;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 25;
  page.drawText('GRAND TOTAL:', {
    x: 400,
    y: yPosition,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(formatCentsEUR(BigInt(Math.round(totalCost * 100))), {
    x: 500,
    y: yPosition,
    size: 18,
    font: boldFont,
    color: rgb(0.2, 0.4, 0.8),
  });
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  
  const timestamp = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `snijtool-quote-${timestamp}.pdf`);
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
