import type { IReviewService, ServiceResult, SearchBusinessesResult, ListReviewsResult } from '../types/service.js';
import type { BusinessLocation, Review } from '../types/domain.js';

// Deterministic mock data for development and testing

const MOCK_LOCATIONS: BusinessLocation[] = [
  {
    placeId: 'mock-place-001',
    displayName: 'Bella Vista Italian Restaurant',
    fullAddress: '123 Main Street, San Francisco, CA 94102, US',
    phone: '+1-555-0101',
    website: 'https://bellavista.example.com',
    address: {
      lines: ['123 Main Street'],
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'US',
    },
    category: 'Italian Restaurant',
    rating: 3.8,
    reviewCount: 25,
  },
  {
    placeId: 'mock-place-002',
    displayName: 'Glow Beauty Salon',
    fullAddress: '456 Oak Avenue, San Francisco, CA 94110, US',
    phone: '+1-555-0202',
    website: 'https://glowsalon.example.com',
    address: {
      lines: ['456 Oak Avenue'],
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94110',
      country: 'US',
    },
    category: 'Beauty Salon',
    rating: 4.2,
    reviewCount: 25,
  },
  {
    placeId: 'mock-place-003',
    displayName: 'Bright Smile Dental',
    fullAddress: '789 Elm Boulevard, Suite 200, San Francisco, CA 94115, US',
    phone: '+1-555-0303',
    website: 'https://brightsmile.example.com',
    address: {
      lines: ['789 Elm Boulevard', 'Suite 200'],
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94115',
      country: 'US',
    },
    category: 'Dental Clinic',
    rating: 4.0,
    reviewCount: 25,
  },
];

function generateMockReviews(placeId: string): Review[] {
  const reviewData = [
    { stars: 5, comment: 'Absolutely amazing experience! The staff was incredibly friendly and professional. Will definitely come back!', name: 'Sarah M.' },
    { stars: 5, comment: 'Best in the city, hands down. The attention to detail is outstanding.', name: 'John D.' },
    { stars: 4, comment: 'Great service overall. The wait was a bit long but the quality made up for it.', name: 'Emily R.' },
    { stars: 5, comment: 'I\'ve been coming here for years and it keeps getting better. Highly recommended!', name: 'Michael P.' },
    { stars: 3, comment: 'Decent experience. Nothing special but nothing bad either. Average pricing.', name: 'Lisa K.' },
    { stars: 1, comment: 'Terrible experience. Waited 45 minutes past my appointment time. The manager was rude when I complained. Will not be returning.', name: 'David W.' },
    { stars: 2, comment: 'Overpriced for what you get. The quality has gone downhill recently. Very disappointed.', name: 'Karen H.' },
    { stars: 5, comment: 'Wonderful! The new renovation looks great and the service was top-notch.', name: 'Robert J.' },
    { stars: 4, comment: 'Very good experience. Clean, professional, and reasonably priced. Minor parking issues.', name: 'Amanda S.' },
    { stars: 1, comment: 'Found a hair in my food and the staff didn\'t even apologize. Disgusting. Health department should inspect this place.', name: 'Tom B.' },
    { stars: 5, comment: 'Just moved to the area and so glad I found this place. Everyone is so welcoming!', name: 'Jennifer L.' },
    { stars: 4, comment: 'Good quality and fair prices. The booking system could be improved though.', name: 'Chris M.' },
    { stars: 2, comment: 'They cancelled my appointment last minute with no explanation. Very unprofessional.', name: 'Nancy G.' },
    { stars: 5, comment: 'The owner personally made sure everything was perfect. You can tell they really care about their customers.', name: 'Alex T.' },
    { stars: 3, comment: 'It was okay. Nothing to write home about. The location is convenient though.', name: 'Patricia F.' },
    { stars: 4, comment: 'Solid experience. Would recommend to friends and family. Great value for money.', name: 'Brian C.' },
    { stars: 1, comment: 'Charged me double and refused to fix it. Had to dispute with my credit card company. Avoid!', name: 'Sandra N.' },
    { stars: 5, comment: 'Exceeded all expectations! The team goes above and beyond every single time.', name: 'Mark E.' },
    { stars: 4, comment: 'Really enjoyed my visit. The ambiance is lovely and the service was prompt.', name: 'Rachel A.' },
    { stars: 3, comment: 'Average experience. Some things were good, others need improvement. Not bad overall.', name: 'Steve V.' },
    { stars: 5, comment: 'This place is a hidden gem! Can\'t believe I didn\'t discover it sooner.', name: 'Laura Z.' },
    { stars: 2, comment: 'Poor customer service. Staff seemed disinterested and rushed through everything.', name: 'Daniel O.' },
    { stars: 5, comment: 'Perfect every time. Consistent quality that you can always count on.', name: 'Michelle I.' },
    { stars: 4, comment: 'Very happy with the results. Professional staff and clean environment.', name: 'Kevin U.' },
    { stars: 3, comment: 'It\'s fine for what it is. Nothing exceptional but gets the job done.', name: 'Angela Y.' },
  ];

  const now = Date.now();

  return reviewData.map((data, i) => {
    const daysAgo = i * 2 + Math.floor(i / 5);
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const hasReply = i % 4 === 0; // Every 4th review has a reply

    return {
      id: `review-${placeId}-${String(i + 1).padStart(3, '0')}`,
      placeId,
      reviewerName: data.name,
      isAnonymous: false,
      stars: data.stars,
      comment: data.comment,
      createdAt,
      updatedAt: createdAt,
      reply: hasReply
        ? {
            comment: 'Thank you for your feedback! We appreciate you taking the time to share your experience.',
            updatedAt: new Date(now - (daysAgo - 1) * 24 * 60 * 60 * 1000).toISOString(),
          }
        : undefined,
    };
  });
}

export class MockReviewService implements IReviewService {
  private readonly reviewsByPlace: Map<string, Review[]>;

  constructor() {
    this.reviewsByPlace = new Map();
    for (const location of MOCK_LOCATIONS) {
      this.reviewsByPlace.set(location.placeId, generateMockReviews(location.placeId));
    }
  }

  async searchBusinesses(
    query: string,
    limit: number = 5,
  ): Promise<ServiceResult<SearchBusinessesResult>> {
    const lowerQuery = query.toLowerCase();
    const matched = MOCK_LOCATIONS.filter((loc) =>
      loc.displayName.toLowerCase().includes(lowerQuery)
      || (loc.category?.toLowerCase().includes(lowerQuery) ?? false)
      || (loc.fullAddress?.toLowerCase().includes(lowerQuery) ?? false)
    ).slice(0, limit);

    // If no exact match, return all (simulates broad search)
    const businesses = matched.length > 0 ? matched : MOCK_LOCATIONS.slice(0, limit);

    return {
      success: true,
      data: { businesses },
    };
  }

  async getReviews(
    placeId: string,
    options: { reviewsLimit?: number } = {},
  ): Promise<ServiceResult<ListReviewsResult>> {
    const reviews = this.reviewsByPlace.get(placeId);

    if (!reviews) {
      return {
        success: false,
        error: `Business not found: ${placeId}`,
        errorCode: 'NOT_FOUND',
      };
    }

    const limit = options.reviewsLimit ?? 50;
    const page = reviews.slice(0, limit);

    const totalStars = reviews.reduce((sum, r) => sum + r.stars, 0);
    const averageRating = Math.round((totalStars / reviews.length) * 10) / 10;

    return {
      success: true,
      data: {
        reviews: page,
        averageRating,
        totalReviewCount: reviews.length,
      },
    };
  }

  async getBusinessProfile(
    placeId: string,
  ): Promise<ServiceResult<BusinessLocation>> {
    const location = MOCK_LOCATIONS.find((loc) => loc.placeId === placeId);

    if (!location) {
      return {
        success: false,
        error: `Business not found: ${placeId}`,
        errorCode: 'NOT_FOUND',
      };
    }

    return { success: true, data: location };
  }
}
