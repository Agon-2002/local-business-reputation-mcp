import { describe, it, expect } from 'vitest';
import { mapGoogleLocationToDomain, mapGoogleReviewToDomain } from '../../../src/utils/mappers.js';
import type { GoogleLocation, GoogleReview } from '../../../src/types/google-api.js';

describe('mapGoogleLocationToDomain', () => {
  it('maps a full location', () => {
    const googleLocation: GoogleLocation = {
      name: 'locations/456',
      title: 'Test Restaurant',
      storefrontAddress: {
        addressLines: ['123 Main St'],
        locality: 'San Francisco',
        administrativeArea: 'CA',
        postalCode: '94102',
        regionCode: 'US',
      },
      websiteUri: 'https://test.com',
      phoneNumbers: { primaryPhone: '+1-555-0000' },
      primaryCategory: { displayName: 'Restaurant' },
    };

    const result = mapGoogleLocationToDomain('accounts/123', googleLocation);

    expect(result.name).toBe('accounts/123/locations/456');
    expect(result.displayName).toBe('Test Restaurant');
    expect(result.phone).toBe('+1-555-0000');
    expect(result.website).toBe('https://test.com');
    expect(result.address?.city).toBe('San Francisco');
    expect(result.category).toBe('Restaurant');
  });

  it('handles missing optional fields', () => {
    const googleLocation: GoogleLocation = {
      name: 'locations/789',
      title: 'Minimal Business',
    };

    const result = mapGoogleLocationToDomain('accounts/123', googleLocation);

    expect(result.name).toBe('accounts/123/locations/789');
    expect(result.displayName).toBe('Minimal Business');
    expect(result.phone).toBeUndefined();
    expect(result.website).toBeUndefined();
    expect(result.address).toBeUndefined();
    expect(result.category).toBeUndefined();
  });
});

describe('mapGoogleReviewToDomain', () => {
  it('maps a full review', () => {
    const googleReview: GoogleReview = {
      reviewId: 'review-001',
      name: 'accounts/123/locations/456/reviews/review-001',
      reviewer: { displayName: 'John D.', isAnonymous: false },
      starRating: 'FIVE',
      comment: 'Great place!',
      createTime: '2026-03-01T10:00:00Z',
      updateTime: '2026-03-01T10:00:00Z',
      reviewReply: {
        comment: 'Thanks John!',
        updateTime: '2026-03-02T10:00:00Z',
      },
    };

    const result = mapGoogleReviewToDomain('accounts/123/locations/456', googleReview);

    expect(result.id).toBe('review-001');
    expect(result.reviewerName).toBe('John D.');
    expect(result.stars).toBe(5);
    expect(result.starRating).toBe('FIVE');
    expect(result.comment).toBe('Great place!');
    expect(result.reply?.comment).toBe('Thanks John!');
  });

  it('handles STAR_RATING_UNSPECIFIED', () => {
    const googleReview: GoogleReview = {
      reviewId: 'review-002',
      name: 'accounts/123/locations/456/reviews/review-002',
      reviewer: { displayName: 'Anonymous' },
      starRating: 'STAR_RATING_UNSPECIFIED',
      createTime: '2026-03-01T10:00:00Z',
      updateTime: '2026-03-01T10:00:00Z',
    };

    const result = mapGoogleReviewToDomain('accounts/123/locations/456', googleReview);

    expect(result.stars).toBe(1);
    expect(result.starRating).toBe('ONE');
  });

  it('handles review without comment', () => {
    const googleReview: GoogleReview = {
      reviewId: 'review-003',
      name: 'accounts/123/locations/456/reviews/review-003',
      reviewer: { displayName: 'Jane', isAnonymous: false },
      starRating: 'FOUR',
      createTime: '2026-03-01T10:00:00Z',
      updateTime: '2026-03-01T10:00:00Z',
    };

    const result = mapGoogleReviewToDomain('accounts/123/locations/456', googleReview);

    expect(result.comment).toBe('');
    expect(result.reply).toBeUndefined();
  });
});
