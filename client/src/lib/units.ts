import { DecScaled } from '@/types';

export function mmToM2(mm2: string): DecScaled {
  // Convert mm² to m² by dividing by 1,000,000
  // Handle decimal inputs by rounding to nearest integer
  const mm2Value = parseFloat(mm2);
  const mm2Rounded = Math.round(mm2Value);
  const mm2BigInt = BigInt(mm2Rounded);
  return {
    i: mm2BigInt.toString(),
    scale: 6 // 6 decimal places to represent division by 1,000,000
  };
}

export function decScaledToNumber(value: DecScaled): number {
  const num = Number(value.i);
  return num / Math.pow(10, value.scale);
}

export function numberToDecScaled(num: number, scale: number): DecScaled {
  const scaled = Math.round(num * Math.pow(10, scale));
  return {
    i: scaled.toString(),
    scale: scale
  };
}

export function multiplyDecScaled(value: DecScaled, factor: number, resultScale: number): DecScaled {
  const num = decScaledToNumber(value);
  const result = num * factor;
  return numberToDecScaled(result, resultScale);
}
