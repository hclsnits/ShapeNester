// src/portfolio/xlsx.ts
import * as XLSX from "xlsx";

/** The shape your UI expects everywhere */
export type PortfolioRow = {
  artikelcode: string | null;
  materiaalsoort: string | null;
  densiteit_raw: string | number | null;     // kept as string if it's a label like "Wolvilt 100%"
  dikte_mm: number | null;                   // number in millimeters
  doekbreedte_mm: number | null;             // number in millimeters
  kleur: string | null;
  prijs_per_m2_cents: number | null;         // integer cents
  snijsnelheid_cm_s: number | null;          // speed in cm/s (optional)
};

type RawRow = Record<string, any>;

/** Normalize header names so we can match flexibly */
function normHeader(h: string): string {
  return String(h || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .replace(/\s*[\(\)\[\]\.\:,;\/\\_-]\s*/g, " ")
    .trim();
}

/** Parse numbers from EU/Dutch formatted cells (e.g. "1.234,56", "12,5 mm", "€ 19,90") */
function parseNumberEU(value: any): number | null {
  if (value == null) return null;
  let s = String(value).trim();
  if (!s) return null;

  // Remove currency and unit words but keep digits, separators, and minus
  s = s
    .replace(/[€$]/g, "")
    .replace(/[a-zA-Z%°]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const hasDot = s.includes(".");
  const hasComma = s.includes(",");

  if (hasDot && hasComma) {
    s = s.replace(/\./g, "").replace(/,/, ".");
  } else if (hasComma && !hasDot) {
    s = s.replace(/,/, ".");
  }

  s = s.replace(/[^\d\.\-]/g, "");
  if (!s || s === "-" || s === ".") return null;

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Coerce mm values (accepts numbers, "12", "12,0", "12 mm") */
function toMm(value: any): number | null {
  const n = parseNumberEU(value);
  if (n == null) return null;
  return Math.round(n); // keep int mm; UI casts to BigInt later
}

/** Coerce price in EUR -> cents (integer) */
function toCentsEUR(value: any): number | null {
  const n = parseNumberEU(value);
  if (n == null) return null;
  return Math.round(n * 100);
}

/** Coerce speed to cm/s (keep up to 3 decimals if present) */
function toSpeedCmPerSec(value: any): number | null {
  const n = parseNumberEU(value);
  if (n == null) return null;
  return Math.round(n * 1000) / 1000;
}

/** Map many possible header variants to our canonical field names */
const HEADER_MAP: Record<string, keyof PortfolioRow> = {
  // artikelcode
  "artikelcode": "artikelcode",
  "artikel code": "artikelcode",
  "art nr": "artikelcode",
  "artnr": "artikelcode",
  "sku": "artikelcode",
  "code": "artikelcode",

  // materiaalsoort
  "materiaalsoort": "materiaalsoort",
  "materiaal soort": "materiaalsoort",
  "materiaal": "materiaalsoort",
  "type": "materiaalsoort",

  // densiteit
  "densiteit": "densiteit_raw",
  "dichtheid": "densiteit_raw",
  "density": "densiteit_raw",
  "densiteit kg m3": "densiteit_raw",
  "dichtheid kg m3": "densiteit_raw",

  // dikte (mm)
  "dikte": "dikte_mm",
  "dikte mm": "dikte_mm",
  "thickness": "dikte_mm",
  "thickness mm": "dikte_mm",

  // doekbreedte (mm)
  "doekbreedte": "doekbreedte_mm",
  "doekbreedte mm": "doekbreedte_mm",
  "breedte": "doekbreedte_mm",
  "breedte mm": "doekbreedte_mm",
  "rolbreedte": "doekbreedte_mm",
  "rolbreedte mm": "doekbreedte_mm",
  "width": "doekbreedte_mm",
  "width mm": "doekbreedte_mm",

  // kleur
  "kleur": "kleur",
  "color": "kleur",
  "kleuromschrijving": "kleur",

  // prijs per m2 (EUR -> cents)
  "prijs per m2": "prijs_per_m2_cents",
  "prijs m2": "prijs_per_m2_cents",
  "prijs €/m2": "prijs_per_m2_cents",
  "prijs eur m2": "prijs_per_m2_cents",
  "price per m2": "prijs_per_m2_cents",
  "price €/m2": "prijs_per_m2_cents",
  "prijs": "prijs_per_m2_cents",

  // snijsnelheid (cm/s)
  "snijsnelheid_cm_s": "snijsnelheid_cm_s",
};

/** Try to guess which worksheet contains the data (first non-empty with tabular shape) */
function pickWorksheet(wb: XLSX.WorkBook): XLSX.WorkSheet {
  const names = wb.SheetNames || [];
  for (const name of names) {
    const ws = wb.Sheets[name];
    const ref = ws["!ref"];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    const rows = range.e.r - range.s.r + 1;
    const cols = range.e.c - range.s.c + 1;
    if (rows >= 2 && cols >= 2) return ws;
  }
  return wb.Sheets[wb.SheetNames[0]];
}

/** Pick which row is actually the header by counting known fields */
function findHeaderRow(aoa: any[][]): number {
  const MAX_SCAN = Math.min(10, aoa.length); // scan first up to 10 rows
  let bestRow = 0;
  let bestScore = -1;

  for (let r = 0; r < MAX_SCAN; r++) {
    const cells = aoa[r] ?? [];
    let score = 0;
    for (const cell of cells) {
      const k = normHeader(String(cell));
      if (k && HEADER_MAP[k]) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }
  return bestRow;
}

/** Parse the uploaded Excel file into PortfolioRow[] */
export async function parsePortfolioXlsx(file: File): Promise<PortfolioRow[]> {
  const arrayBuf = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuf, { type: "array" });

  const ws = pickWorksheet(wb);
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (!aoa.length) return [];

  // Detect actual header row
  const headerRowIndex = findHeaderRow(aoa);
  const headerRow = aoa[headerRowIndex] as string[];

  // Build column -> field map
  const colToField: Record<number, keyof PortfolioRow | null> = {};
  headerRow.forEach((raw, idx) => {
    const key = normHeader(String(raw));
    colToField[idx] = HEADER_MAP[key] ?? null;
  });

  // Iterate data rows (start after the detected header)
  const out: PortfolioRow[] = [];
  for (let r = headerRowIndex + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row || row.every((c: any) => String(c ?? "").trim() === "")) continue;

    const acc: PortfolioRow = {
      artikelcode: null,
      materiaalsoort: null,
      densiteit_raw: null,
      dikte_mm: null,
      doekbreedte_mm: null,
      kleur: null,
      prijs_per_m2_cents: null,
      snijsnelheid_cm_s: null,
    };

    for (let c = 0; c < row.length; c++) {
      const field = colToField[c];
      if (!field) continue;

      const cell = row[c];

      switch (field) {
        case "dikte_mm":
          acc.dikte_mm = toMm(cell);
          break;

        case "doekbreedte_mm":
          acc.doekbreedte_mm = toMm(cell);
          break;

        case "prijs_per_m2_cents":
          acc.prijs_per_m2_cents = toCentsEUR(cell);
          break;

        case "snijsnelheid_cm_s":
          acc.snijsnelheid_cm_s = toSpeedCmPerSec(cell);
          break;

        case "densiteit_raw": {
          // keep textual values (e.g., "Wolvilt 100%") as-is; if numeric, keep numeric
          const n = parseNumberEU(cell);
          acc.densiteit_raw = n != null ? n : String(cell ?? "").trim() || null;
          break;
        }

        case "artikelcode":
        case "materiaalsoort":
        case "kleur": {
          const s = String(cell ?? "").trim();
          acc[field] = s ? s : null;
          break;
        }
      }
    }

    // Only include rows that have at least an artikelcode or something meaningful
    const meaningful =
      (acc.artikelcode && acc.artikelcode !== "") ||
      acc.materiaalsoort ||
      acc.kleur ||
      acc.prijs_per_m2_cents != null ||
      acc.dikte_mm != null ||
      acc.densiteit_raw != null;

    if (meaningful) out.push(acc);
  }

  // Optional visibility for debugging while you test
  // console.log("Detected header row:", headerRowIndex, headerRow);
  // console.log("First parsed row:", out[0]);

  return out;
}

// Function to parse from ArrayBuffer for API usage
export async function parsePortfolioFromBuffer(buffer: ArrayBuffer): Promise<PortfolioRow[]> {
  const wb = XLSX.read(buffer, { type: "array" });

  const ws = pickWorksheet(wb);
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  if (!aoa.length) return [];

  // Detect actual header row
  const headerRowIndex = findHeaderRow(aoa);
  const headerRow = aoa[headerRowIndex] as string[];

  // Build column -> field map
  const colToField: Record<number, keyof PortfolioRow | null> = {};
  headerRow.forEach((raw, idx) => {
    const key = normHeader(String(raw));
    colToField[idx] = HEADER_MAP[key] ?? null;
  });

  // Iterate data rows (start after the detected header)
  const out: PortfolioRow[] = [];
  for (let r = headerRowIndex + 1; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row || row.every((c: any) => String(c ?? "").trim() === "")) continue;

    const acc: PortfolioRow = {
      artikelcode: null,
      materiaalsoort: null,
      densiteit_raw: null,
      dikte_mm: null,
      doekbreedte_mm: null,
      kleur: null,
      prijs_per_m2_cents: null,
      snijsnelheid_cm_s: null,
    };

    for (let c = 0; c < row.length; c++) {
      const field = colToField[c];
      if (!field) continue;

      const cell = row[c];

      switch (field) {
        case "dikte_mm":
          acc.dikte_mm = toMm(cell);
          break;

        case "doekbreedte_mm":
          acc.doekbreedte_mm = toMm(cell);
          break;

        case "prijs_per_m2_cents":
          acc.prijs_per_m2_cents = toCentsEUR(cell);
          break;

        case "snijsnelheid_cm_s":
          acc.snijsnelheid_cm_s = toSpeedCmPerSec(cell);
          break;

        case "densiteit_raw": {
          // keep textual values (e.g., "Wolvilt 100%") as-is; if numeric, keep numeric
          const n = parseNumberEU(cell);
          acc.densiteit_raw = n != null ? n : String(cell ?? "").trim() || null;
          break;
        }

        case "artikelcode":
        case "materiaalsoort":
        case "kleur": {
          const s = String(cell ?? "").trim();
          acc[field] = s ? s : null;
          break;
        }
      }
    }

    // Only include rows that have at least an artikelcode or something meaningful
    const meaningful =
      (acc.artikelcode && acc.artikelcode !== "") ||
      acc.materiaalsoort ||
      acc.kleur ||
      acc.prijs_per_m2_cents != null ||
      acc.dikte_mm != null ||
      acc.densiteit_raw != null;

    if (meaningful) out.push(acc);
  }

  return out;
}

export interface ParsedPortfolioData {
  materials: PortfolioRow[];
  densiteits: string[];
  diktes: string[];
  colors: string[];
}

export async function loadMaterialPortfolio(): Promise<ParsedPortfolioData> {
  try {
    console.log('Attempting to fetch Excel file...');
    const response = await fetch('/api/portfolio/excel');
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Successfully loaded Excel file, size:', arrayBuffer.byteLength, 'bytes');
    
    const materials = await parsePortfolioFromBuffer(arrayBuffer);
    
    // Extract unique values for filters
    const densiteits = new Set<string>();
    const diktes = new Set<string>();
    const colors = new Set<string>();
    
    materials.forEach(material => {
      if (material.densiteit_raw != null) {
        densiteits.add(String(material.densiteit_raw));
      }
      if (material.dikte_mm != null) {
        diktes.add(String(material.dikte_mm));
      }
      if (material.kleur) {
        colors.add(material.kleur);
      }
    });
    
    // Sort unique values
    const sortedDensiteits = Array.from(densiteits).sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
    const sortedDiktes = Array.from(diktes).sort((a, b) => Number(a) - Number(b));
    const sortedColors = Array.from(colors).sort();
    
    console.log(`Loaded ${materials.length} materials from Excel file`);
    
    return {
      materials,
      densiteits: sortedDensiteits,
      diktes: sortedDiktes,
      colors: sortedColors
    };
  } catch (error) {
    console.error('Error loading material portfolio:', error);
    throw error;
  }
}