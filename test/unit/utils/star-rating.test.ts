import { describe, it, expect } from 'vitest';
import { starRatingToNumber, numberToStarRating, formatStars, isInStarRange } from '../../../src/utils/star-rating.js';

describe('starRatingToNumber', () => {
  it('converts all star ratings', () => {
    expect(starRatingToNumber('ONE')).toBe(1);
    expect(starRatingToNumber('TWO')).toBe(2);
    expect(starRatingToNumber('THREE')).toBe(3);
    expect(starRatingToNumber('FOUR')).toBe(4);
    expect(starRatingToNumber('FIVE')).toBe(5);
  });
});

describe('numberToStarRating', () => {
  it('converts all numbers', () => {
    expect(numberToStarRating(1)).toBe('ONE');
    expect(numberToStarRating(2)).toBe('TWO');
    expect(numberToStarRating(3)).toBe('THREE');
    expect(numberToStarRating(4)).toBe('FOUR');
    expect(numberToStarRating(5)).toBe('FIVE');
  });

  it('throws for invalid numbers', () => {
    expect(() => numberToStarRating(0)).toThrow('Invalid star rating');
    expect(() => numberToStarRating(6)).toThrow('Invalid star rating');
  });
});

describe('formatStars', () => {
  it('formats star ratings as visual stars', () => {
    expect(formatStars(1)).toBe('★☆☆☆☆');
    expect(formatStars(3)).toBe('★★★☆☆');
    expect(formatStars(5)).toBe('★★★★★');
  });

  it('accepts enum values', () => {
    expect(formatStars('ONE')).toBe('★☆☆☆☆');
    expect(formatStars('FIVE')).toBe('★★★★★');
  });
});

describe('isInStarRange', () => {
  it('returns true when no constraints', () => {
    expect(isInStarRange('THREE')).toBe(true);
  });

  it('filters by min stars', () => {
    expect(isInStarRange('THREE', 4)).toBe(false);
    expect(isInStarRange('FOUR', 4)).toBe(true);
    expect(isInStarRange('FIVE', 4)).toBe(true);
  });

  it('filters by max stars', () => {
    expect(isInStarRange('THREE', undefined, 2)).toBe(false);
    expect(isInStarRange('TWO', undefined, 2)).toBe(true);
    expect(isInStarRange('ONE', undefined, 2)).toBe(true);
  });

  it('filters by range', () => {
    expect(isInStarRange('THREE', 2, 4)).toBe(true);
    expect(isInStarRange('ONE', 2, 4)).toBe(false);
    expect(isInStarRange('FIVE', 2, 4)).toBe(false);
  });
});
