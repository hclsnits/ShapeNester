import * as XLSX from 'xlsx';
import { Material } from '@/types';

export interface ParsedPortfolioData {
  materials: Material[];
  densiteits: string[];
  diktes: string[];
  colors: string[];
}

export async function loadMaterialPortfolio(): Promise<ParsedPortfolioData> {
  try {
    console.log('Attempting to fetch Excel file...');
    const response = await fetch('/api/portfolio/excel');
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio: ${response.status} ${response.statusText}`);
    }
    
    // Check content type
    const contentType = response.headers.get('content-type');
    console.log('Content type:', contentType);
    
    if (contentType && contentType.includes('text/html')) {
      console.warn('Server is returning HTML instead of Excel file. This might be a routing issue.');
      const text = await response.text();
      console.log('Response body (first 500 chars):', text.substring(0, 500));
      throw new Error('Server returned HTML instead of Excel file');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Successfully loaded Excel file, size:', arrayBuffer.byteLength, 'bytes');
    
    return parseExcelFile(arrayBuffer);
  } catch (error) {
    console.error('Error loading material portfolio:', error);
    throw error;
  }
}

export function parseExcelFile(buffer: ArrayBuffer): ParsedPortfolioData {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert sheet to JSON with header row
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  
  if (rawData.length < 2) {
    throw new Error('Excel file must have at least a header row and one data row');
  }
  
  const headers = rawData[0] as string[];
  const dataRows = rawData.slice(1);
  
  // Map common header variations to expected field names
  const fieldMapping = {
    'artikelcode': ['artikelcode', 'article_code', 'code', 'artikel'],
    'materiaalsoort': ['materiaalsoort', 'material_type', 'material', 'type'],
    'densiteit_g_cm3': ['densiteit', 'density', 'densiteit_kg_m3', 'kg/m3', 'g/cm3', 'densiteit_g_cm3'],
    'dikte_mm': ['dikte', 'thickness', 'dikte_mm', 'mm'],
    'doekbreedte_mm': ['doekbreedte', 'width', 'doekbreedte_mm', 'breedte'],
    'kleur': ['kleur', 'color', 'colour'],
    'prijs_per_m2_cents': ['prijs', 'price', 'prijs_per_m2', 'cost', 'prijs_per_m2_cents']
  };
  
  // Create column index mapping
  const columnMapping: Record<string, number> = {};
  
  Object.entries(fieldMapping).forEach(([field, variations]) => {
    for (const variation of variations) {
      const index = headers.findIndex(h => 
        h && h.toString().toLowerCase().includes(variation.toLowerCase())
      );
      if (index !== -1) {
        columnMapping[field] = index;
        break;
      }
    }
  });
  
  // Validate required columns exist
  const requiredFields = ['artikelcode', 'materiaalsoort', 'densiteit_g_cm3', 'dikte_mm', 'kleur', 'prijs_per_m2_cents'];
  const missingFields = requiredFields.filter(field => !(field in columnMapping));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required columns: ${missingFields.join(', ')}. Available columns: ${headers.join(', ')}`);
  }
  
  const materials: Material[] = [];
  const densiteits = new Set<string>();
  const diktes = new Set<string>();
  const colors = new Set<string>();
  
  dataRows.forEach((row, index) => {
    try {
      if (!row || row.every(cell => !cell && cell !== 0)) {
        return; // Skip empty rows
      }
      
      const artikelcode = String(row[columnMapping.artikelcode] || '').trim();
      const materiaalsoort = String(row[columnMapping.materiaalsoort] || '').trim();
      const densiteitValue = row[columnMapping.densiteit_g_cm3];
      const dikteValue = row[columnMapping.dikte_mm];
      const kleur = String(row[columnMapping.kleur] || '').trim();
      const prijsValue = row[columnMapping.prijs_per_m2_cents];
      
      if (!artikelcode || !materiaalsoort || !kleur) {
        console.warn(`Skipping row ${index + 2}: Missing required fields`);
        return;
      }
      
      // Parse numeric values
      const densiteit = parseFloat(String(densiteitValue || '0'));
      const dikte = parseFloat(String(dikteValue || '0'));
      let prijs = parseFloat(String(prijsValue || '0'));
      
      // Convert price to cents if it's in euros
      if (prijs > 0 && prijs < 1000) {
        prijs = prijs * 100; // Convert euros to cents
      }
      
      if (isNaN(densiteit) || isNaN(dikte) || isNaN(prijs)) {
        console.warn(`Skipping row ${index + 2}: Invalid numeric values`);
        return;
      }
      
      const doekbreedte = columnMapping.doekbreedte_mm !== undefined 
        ? String(row[columnMapping.doekbreedte_mm] || '1500')
        : '1500'; // Default width
      
      const material: Material = {
        artikelcode,
        materiaalsoort,
        densiteit_g_cm3: { i: String(Math.round(densiteit * 100) / 100), scale: 0 },
        dikte_mm: String(Math.round(dikte)),
        doekbreedte_mm: String(Math.round(parseFloat(doekbreedte))),
        kleur,
        prijs_per_m2_cents: String(Math.round(prijs))
      };
      
      materials.push(material);
      densiteits.add(String(Math.round(densiteit)));
      diktes.add(String(Math.round(dikte)));
      colors.add(kleur);
      
    } catch (error) {
      console.warn(`Error processing row ${index + 2}:`, error);
    }
  });
  
  if (materials.length === 0) {
    throw new Error('No valid materials found in Excel file');
  }
  
  // Sort unique values
  const sortedDensiteits = Array.from(densiteits).sort((a, b) => Number(a) - Number(b));
  const sortedDiktes = Array.from(diktes).sort((a, b) => Number(a) - Number(b));
  const sortedColors = Array.from(colors).sort();
  
  console.log(`Loaded ${materials.length} materials from Excel file`);
  
  return {
    materials,
    densiteits: sortedDensiteits,
    diktes: sortedDiktes,
    colors: sortedColors
  };
}