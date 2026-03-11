import { STAR_RATING_MAP, NUMBER_TO_STAR_RATING, type StarRatingEnum } from './constants.js';

export function starRatingToNumber(rating: StarRatingEnum): number {
  return STAR_RATING_MAP[rating];
}

export function numberToStarRating(num: number): StarRatingEnum {
  const rating = NUMBER_TO_STAR_RATING[num];
  if (!rating) {
    throw new Error(`Invalid star rating number: ${num}. Must be 1-5.`);
  }
  return rating;
}

export function formatStars(rating: StarRatingEnum | number): string {
  const num = typeof rating === 'number' ? rating : starRatingToNumber(rating);
  return `${'★'.repeat(num)}${'☆'.repeat(5 - num)}`;
}

export function isInStarRange(
  rating: StarRatingEnum,
  minStars?: number,
  maxStars?: number,
): boolean {
  const num = starRatingToNumber(rating);
  if (minStars !== undefined && num < minStars) return false;
  if (maxStars !== undefined && num > maxStars) return false;
  return true;
}
