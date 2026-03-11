export function formatStars(rating: number): string {
  const clamped = Math.max(1, Math.min(5, Math.round(rating)));
  return `${'★'.repeat(clamped)}${'☆'.repeat(5 - clamped)}`;
}

export function isInStarRange(
  stars: number,
  minStars?: number,
  maxStars?: number,
): boolean {
  if (minStars !== undefined && stars < minStars) return false;
  if (maxStars !== undefined && stars > maxStars) return false;
  return true;
}
