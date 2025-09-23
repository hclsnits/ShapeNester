export function formatCentsEUR(cents: bigint): string {
  const euros = Number(cents) / 100;
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros);
}

export function toCents(euros: number): bigint {
  return BigInt(Math.round(euros * 100));
}

export function centsToEuros(cents: string): number {
  return Number(BigInt(cents)) / 100;
}

export function addCents(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}

export function multiplyCents(cents: string, factor: number): string {
  const result = BigInt(cents) * BigInt(Math.round(factor * 100)) / BigInt(100);
  return result.toString();
}
