export function expiryReducedTooltip(limitedByQualificationName: string): string {
  return `Expiry date reduced due to ${limitedByQualificationName} qualification`;
}

export function isExpiryReduced(
  originalExpiryDate: Date,
  expiryDate: Date,
): boolean {
  return originalExpiryDate.getTime() !== expiryDate.getTime();
}
