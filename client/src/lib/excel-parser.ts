import * as XLSX from 'xlsx';

export interface MaterialData {
  densiteit: string; // Density
  dikte: string; // Thickness 
  kleur: string; // Color
  code: string;
  description: string;
  pricePerM2: number;
  [key: string]: any; // Allow additional properties
}

export interface MaterialFilters {
  densiteit: string[];
  dikte: string[];
  kleur: string[];
}

export function parseExcelFile(file: File): Promise<{ materials: MaterialData[], filters: MaterialFilters }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        
        // Assuming first row is headers
        if (jsonData.length < 2) {
          throw new Error('Excel file must have at least 2 rows (header + data)');
        }
        
        const headers = jsonData[0] as string[];
        const materials: MaterialData[] = [];
        const densiteitSet = new Set<string>();
        const dikteSet = new Set<string>();
        const kleurSet = new Set<string>();
        
        // Process each data row
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue; // Skip empty rows
          
          const material: any = {};
          
          // Map each column to its header
          headers.forEach((header, index) => {
            const value = row[index];
            if (value !== undefined && value !== null) {
              material[header.toLowerCase().trim()] = value;
            }
          });
          
          // Extract the required fields and create standardized material object
          const materialData: MaterialData = {
            densiteit: String(material.densiteit || material.density || '').trim(),
            dikte: String(material.dikte || material.thickness || material.dikte || '').trim(), 
            kleur: String(material.kleur || material.color || material.kleur || '').trim(),
            code: String(material.code || material.artikelcode || material.id || `MAT-${i}`).trim(),
            description: String(material.description || material.beschrijving || material.naam || '').trim(),
            pricePerM2: parseFloat(String(material.prijs || material.price || material.prijsperm2 || '0').replace(/[^\d.,]/g, '').replace(',', '.')),
            ...material // Include all other fields
          };
          
          // Only add if we have the essential data
          if (materialData.densiteit && materialData.dikte && materialData.kleur) {
            materials.push(materialData);
            densiteitSet.add(materialData.densiteit);
            dikteSet.add(materialData.dikte);
            kleurSet.add(materialData.kleur);
          }
        }
        
        const filters: MaterialFilters = {
          densiteit: Array.from(densiteitSet).sort(),
          dikte: Array.from(dikteSet).sort(),
          kleur: Array.from(kleurSet).sort()
        };
        
        resolve({ materials, filters });
        
      } catch (error) {
        reject(new Error(`Error parsing Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// Helper function to load the portfolio Excel file
export async function loadMaterialPortfolio(): Promise<{ materials: MaterialData[], filters: MaterialFilters }> {
  try {
    // Try to fetch the attached Excel file
    const response = await fetch('/attached_assets/wolviltportfolio_1758653743877.xls');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
    
    // Get the first worksheet
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
    
    // Assuming first row is headers
    if (jsonData.length < 2) {
      throw new Error('Excel file must have at least 2 rows (header + data)');
    }
    
    const headers = jsonData[0] as string[];
    const materials: MaterialData[] = [];
    const densiteitSet = new Set<string>();
    const dikteSet = new Set<string>();
    const kleurSet = new Set<string>();
    
    // Process each data row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!row || row.length === 0) continue; // Skip empty rows
      
      const material: any = {};
      
      // Map each column to its header
      headers.forEach((header, index) => {
        const value = row[index];
        if (value !== undefined && value !== null) {
          material[header.toLowerCase().trim()] = value;
        }
      });
      
      // Extract the required fields and create standardized material object
      const materialData: MaterialData = {
        densiteit: String(material.densiteit || material.density || '').trim(),
        dikte: String(material.dikte || material.thickness || '').trim(), 
        kleur: String(material.kleur || material.color || '').trim(),
        code: String(material.code || material.artikelcode || material.id || `MAT-${i}`).trim(),
        description: String(material.description || material.beschrijving || material.naam || '').trim(),
        pricePerM2: parseFloat(String(material.prijs || material.price || material.prijsperm2 || '0').replace(/[^\d.,]/g, '').replace(',', '.')),
        ...material // Include all other fields
      };
      
      // Only add if we have the essential data
      if (materialData.densiteit && materialData.dikte && materialData.kleur) {
        materials.push(materialData);
        densiteitSet.add(materialData.densiteit);
        dikteSet.add(materialData.dikte);
        kleurSet.add(materialData.kleur);
      }
    }
    
    const filters: MaterialFilters = {
      densiteit: Array.from(densiteitSet).sort(),
      dikte: Array.from(dikteSet).sort(),
      kleur: Array.from(kleurSet).sort()
    };
    
    return { materials, filters };
    
  } catch (error) {
    console.error('Error loading material portfolio:', error);
    // Return fallback data if file can't be loaded
    return {
      materials: [],
      filters: {
        densiteit: [],
        dikte: [],
        kleur: []
      }
    };
  }
}