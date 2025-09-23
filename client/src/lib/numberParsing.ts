import { DecScaled } from '@/types';

export function parseDecimal(value: string, scale: number): DecScaled {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { i: "0", scale };
  }
  
  const scaled = Math.round(num * Math.pow(10, scale));
  return {
    i: scaled.toString(),
    scale: scale
  };
}

export function parseInteger(value: string): string {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 0) {
    return "0";
  }
  return num.toString();
}

export function isValidInteger(value: string): boolean {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= 0 && num.toString() === value;
}

export function isValidDecimal(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0;
}
