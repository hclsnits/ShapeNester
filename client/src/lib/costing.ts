import { Material, NestingSummary, CostBreakdown, DecScaled } from '@/types';
import { decScaledToNumber, multiplyDecScaled } from './units';
import { toCents } from './money';

export interface CostingParams {
  material: Material;
  nesting: NestingSummary;
  quantity: number;
  perimeter_mm: string;
  pricePerM2: number; // euros
  hourlyRate: number; // euros per hour
  cuttingSpeed: number; // cm/s
  kotFee: number; // euros
  optionsCost: number; // euros
}

export function calculateCosting(params: CostingParams): CostBreakdown {
  const baseMaterialM2 = params.nesting.material_m2;
  
  // Material cost
  const materialCostEuros = decScaledToNumber(baseMaterialM2) * params.pricePerM2;
  const materialCostCents = toCents(materialCostEuros);
  
  // Work time calculation
  const perimeterMm = BigInt(params.perimeter_mm);
  const perimeterCm = Number(perimeterMm) / 10; // Convert mm to cm
  const totalPerimeterCm = perimeterCm * params.quantity;
  const cuttingTimeSeconds = totalPerimeterCm / params.cuttingSpeed;
  const cuttingTimeMinutes = cuttingTimeSeconds / 60;
  const cuttingTimeHours = cuttingTimeMinutes / 60;
  
  const workCostEuros = cuttingTimeHours * params.hourlyRate;
  const workCostCents = toCents(workCostEuros);
  
  // Options cost
  const optionsCostCents = toCents(params.optionsCost);
  
  // KOT fee
  const kotCents = toCents(params.kotFee);
  
  // Total
  const totalCents = materialCostCents + workCostCents + optionsCostCents + kotCents;
  
  return {
    base_m2: baseMaterialM2,
    material_cost_cents: materialCostCents.toString(),
    work_cost_cents: workCostCents.toString(),
    options_cost_cents: optionsCostCents.toString(),
    kot_cents: kotCents.toString(),
    total_cents: totalCents.toString()
  };
}
