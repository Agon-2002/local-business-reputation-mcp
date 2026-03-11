import type {
  ICompetitorService,
  ServiceResult,
  SearchCompetitorsResult,
  CompetitorReviewsResult,
} from '../types/service.js';
import type { CompetitorBusiness, CompetitorReviewAnalysis } from '../types/domain.js';

const MOCK_COMPETITORS: CompetitorBusiness[] = [
  {
    placeId: 'comp-001',
    name: 'Trattoria Roma',
    fullAddress: '456 Oak Ave, Springfield, IL 62701',
    rating: 4.2,
    reviewCount: 187,
    phone: '+1-555-0201',
    category: 'Italian restaurant',
  },
  {
    placeId: 'comp-002',
    name: 'Pasta Palace',
    fullAddress: '789 Elm St, Springfield, IL 62702',
    rating: 3.8,
    reviewCount: 94,
    phone: '+1-555-0202',
    category: 'Italian restaurant',
  },
  {
    placeId: 'comp-003',
    name: 'Luigi\'s Kitchen',
    fullAddress: '321 Pine Rd, Springfield, IL 62703',
    rating: 4.6,
    reviewCount: 312,
    phone: '+1-555-0203',
    category: 'Italian restaurant',
  },
  {
    placeId: 'comp-004',
    name: 'Olive Garden Express',
    fullAddress: '555 Maple Dr, Springfield, IL 62704',
    rating: 3.5,
    reviewCount: 256,
    phone: '+1-555-0204',
    category: 'Italian restaurant',
  },
  {
    placeId: 'comp-005',
    name: 'Napoli Pizzeria',
    fullAddress: '678 Cedar Ln, Springfield, IL 62705',
    rating: 4.4,
    reviewCount: 143,
    phone: '+1-555-0205',
    category: 'Pizza restaurant',
  },
];

const MOCK_ANALYSES: CompetitorReviewAnalysis[] = [
  {
    placeId: 'comp-001',
    businessName: 'Trattoria Roma',
    averageRating: 4.2,
    totalReviews: 187,
    ratingDistribution: { one: 8, two: 12, three: 25, four: 67, five: 75 },
    topComplaints: ['slow (4 mentions)', 'expensive (3 mentions)'],
    topCompliments: ['delicious (12 mentions)', 'friendly (8 mentions)', 'quality (6 mentions)'],
    recentReviewCount: 14,
  },
  {
    placeId: 'comp-002',
    businessName: 'Pasta Palace',
    averageRating: 3.8,
    totalReviews: 94,
    ratingDistribution: { one: 6, two: 10, three: 22, four: 32, five: 24 },
    topComplaints: ['cold (5 mentions)', 'wait (4 mentions)', 'dirty (2 mentions)'],
    topCompliments: ['value (6 mentions)', 'quick (4 mentions)'],
    recentReviewCount: 8,
  },
  {
    placeId: 'comp-003',
    businessName: 'Luigi\'s Kitchen',
    averageRating: 4.6,
    totalReviews: 312,
    ratingDistribution: { one: 5, two: 8, three: 20, four: 89, five: 190 },
    topComplaints: ['expensive (3 mentions)'],
    topCompliments: ['amazing (18 mentions)', 'best (15 mentions)', 'perfect (12 mentions)', 'recommend (10 mentions)'],
    recentReviewCount: 22,
  },
  {
    placeId: 'comp-004',
    businessName: 'Olive Garden Express',
    averageRating: 3.5,
    totalReviews: 256,
    ratingDistribution: { one: 25, two: 30, three: 56, four: 78, five: 67 },
    topComplaints: ['slow (8 mentions)', 'rude (5 mentions)', 'wrong (4 mentions)', 'cold (3 mentions)'],
    topCompliments: ['value (7 mentions)', 'fast (5 mentions)'],
    recentReviewCount: 18,
  },
  {
    placeId: 'comp-005',
    businessName: 'Napoli Pizzeria',
    averageRating: 4.4,
    totalReviews: 143,
    ratingDistribution: { one: 3, two: 7, three: 15, four: 48, five: 70 },
    topComplaints: ['wait (3 mentions)'],
    topCompliments: ['delicious (10 mentions)', 'friendly (7 mentions)', 'welcoming (5 mentions)'],
    recentReviewCount: 11,
  },
];

export class MockCompetitorService implements ICompetitorService {
  async searchCompetitors(
    query: string,
    limit: number = 5,
  ): Promise<ServiceResult<SearchCompetitorsResult>> {
    // Return empty for obviously non-matching queries
    if (query.toLowerCase().includes('nonexistent')) {
      return { success: true, data: { competitors: [] } };
    }

    const competitors = MOCK_COMPETITORS.slice(0, limit);
    return { success: true, data: { competitors } };
  }

  async getCompetitorReviews(
    placeIds: string[],
    _reviewsPerPlace: number = 20,
  ): Promise<ServiceResult<CompetitorReviewsResult>> {
    const analyses = MOCK_ANALYSES.filter((a) => placeIds.includes(a.placeId));
    return { success: true, data: { analyses } };
  }
}
