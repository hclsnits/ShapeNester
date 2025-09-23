import { PortfolioRow } from '@/lib/portfolio-parser';
import { Material } from '@/types';

/**
 * Convert PortfolioRow to Material type for compatibility with existing components
 */
export function portfolioRowToMaterial(row: PortfolioRow): Material {
  if (!row.artikelcode || !row.materiaalsoort || !row.kleur) {
    throw new Error('Invalid portfolio row: missing required fields');
  }

  return {
    artikelcode: row.artikelcode,
    materiaalsoort: row.materiaalsoort,
    densiteit_g_cm3: {
      i: String(row.densiteit_g_cm3 || '0'),
      scale: 2
    },
    dikte_mm: String(row.dikte_mm || '0'),
    doekbreedte_mm: String(row.doekbreedte_mm || '1500'),
    kleur: row.kleur,
    prijs_per_m2_cents: String(row.prijs_per_m2_cents || '0')
  };
}

/**
 * Convert Material to PortfolioRow type
 */
export function materialToPortfolioRow(material: Material): PortfolioRow {
  const densityValue = parseFloat(material.densiteit_g_cm3.i) || 0;
  return {
    artikelcode: material.artikelcode,
    materiaalsoort: material.materiaalsoort,
    densiteit_raw: densityValue,
    densiteit_g_cm3: densityValue,
    densiteit_g_cm3_key: densityValue.toFixed(2),
    dikte_mm: parseFloat(material.dikte_mm) || null,
    doekbreedte_mm: parseFloat(material.doekbreedte_mm) || null,
    kleur: material.kleur,
    prijs_per_m2_cents: parseFloat(material.prijs_per_m2_cents) || null,
    snijsnelheid_cm_s: null
  };
}