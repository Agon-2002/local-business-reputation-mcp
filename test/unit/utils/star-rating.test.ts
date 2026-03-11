import { describe, it, expect } from 'vitest';
import { formatStars, isInStarRange } from '../../../src/utils/star-rating.js';

describe('formatStars', () => {
  it('formats integer ratings as visual stars', () => {
    expect(formatStars(1)).toBe('★☆☆☆☆');
    expect(formatStars(2)).toBe('★★☆☆☆');
    expect(formatStars(3)).toBe('★★★☆☆');
    expect(formatStars(4)).toBe('★★★★☆');
    expect(formatStars(5)).toBe('★★★★★');
  });

  it('rounds fractional ratings', () => {
    expect(formatStars(3.4)).toBe('★★★☆☆');
    expect(formatStars(3.5)).toBe('★★★★☆');
    expect(formatStars(4.7)).toBe('★★★★★');
  });

  it('clamps values below 1', () => {
    expect(formatStars(0)).toBe('★☆☆☆☆');
    expect(formatStars(-1)).toBe('★☆☆☆☆');
  });

  it('clamps values above 5', () => {
    expect(formatStars(6)).toBe('★★★★★');
    expect(formatStars(10)).toBe('★★★★★');
  });
});

describe('isInStarRange', () => {
  it('returns true when no constraints', () => {
    expect(isInStarRange(3)).toBe(true);
  });

  it('filters by min stars', () => {
    expect(isInStarRange(3, 4)).toBe(false);
    expect(isInStarRange(4, 4)).toBe(true);
    expect(isInStarRange(5, 4)).toBe(true);
  });

  it('filters by max stars', () => {
    expect(isInStarRange(3, undefined, 2)).toBe(false);
    expect(isInStarRange(2, undefined, 2)).toBe(true);
    expect(isInStarRange(1, undefined, 2)).toBe(true);
  });

  it('filters by range', () => {
    expect(isInStarRange(3, 2, 4)).toBe(true);
    expect(isInStarRange(1, 2, 4)).toBe(false);
    expect(isInStarRange(5, 2, 4)).toBe(false);
  });
});
