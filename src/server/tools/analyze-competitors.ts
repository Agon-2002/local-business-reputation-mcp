import type { ICompetitorService, IReviewService } from '../../types/service.js';
import type { CompetitorReviewAnalysis, CompetitorInsight, RatingDistribution } from '../../types/domain.js';

export interface AnalyzeCompetitorsInput {
  query: string;
  businessLocationName?: string;
  limit?: number;
  reviewsPerCompetitor?: number;
}

function buildOwnAnalysis(
  reviews: Array<{ stars: number; comment: string; reply?: unknown; createdAt: string }>,
  businessName: string,
  locationName: string,
): CompetitorReviewAnalysis {
  const dist: RatingDistribution = { one: 0, two: 0, three: 0, four: 0, five: 0 };
  let total = 0;

  for (const r of reviews) {
    total += r.stars;
    switch (r.stars) {
      case 1: dist.one++; break;
      case 2: dist.two++; break;
      case 3: dist.three++; break;
      case 4: dist.four++; break;
      case 5: dist.five++; break;
    }
  }

  const avg = reviews.length > 0 ? Math.round((total / reviews.length) * 100) / 100 : 0;

  const cutoff30d = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentCount = reviews.filter((r) => new Date(r.createdAt).getTime() > cutoff30d).length;

  return {
    placeId: locationName,
    businessName,
    averageRating: avg,
    totalReviews: reviews.length,
    ratingDistribution: dist,
    topComplaints: [],
    topCompliments: [],
    recentReviewCount: recentCount,
  };
}

function generateInsights(
  competitors: CompetitorReviewAnalysis[],
  ownBusiness?: CompetitorReviewAnalysis,
): CompetitorInsight[] {
  const insights: CompetitorInsight[] = [];

  if (!ownBusiness || competitors.length === 0) return insights;

  const avgMarketRating = competitors.reduce((sum, c) => sum + c.averageRating, 0) / competitors.length;

  if (ownBusiness.averageRating > avgMarketRating + 0.2) {
    insights.push({
      type: 'strength',
      message: `Your rating (${ownBusiness.averageRating.toFixed(1)}) is above the market average (${avgMarketRating.toFixed(1)})`,
    });
  } else if (ownBusiness.averageRating < avgMarketRating - 0.3) {
    insights.push({
      type: 'weakness',
      message: `Your rating (${ownBusiness.averageRating.toFixed(1)}) is below the market average (${avgMarketRating.toFixed(1)})`,
    });
  }

  // Find top-rated competitor
  const topCompetitor = [...competitors].sort((a, b) => b.averageRating - a.averageRating)[0];
  if (topCompetitor && topCompetitor.averageRating > ownBusiness.averageRating) {
    insights.push({
      type: 'opportunity',
      message: `${topCompetitor.businessName} leads with ${topCompetitor.averageRating.toFixed(1)} stars — study their top compliments for ideas`,
    });
  }

  // Find common competitor complaints the user might not have
  const competitorComplaints = new Set(
    competitors.flatMap((c) => c.topComplaints.map((t) => t.split(' (')[0])),
  );
  if (competitorComplaints.size > 0) {
    const top3 = [...competitorComplaints].slice(0, 3);
    insights.push({
      type: 'opportunity',
      message: `Common competitor complaints: ${top3.join(', ')} — ensure you avoid these`,
    });
  }

  return insights;
}

export async function handleAnalyzeCompetitors(
  competitorService: ICompetitorService,
  reviewService: IReviewService,
  input: AnalyzeCompetitorsInput,
) {
  // Step 1: Search for competitors
  const searchResult = await competitorService.searchCompetitors(input.query, input.limit ?? 5);
  if (!searchResult.success || !searchResult.data) {
    return {
      content: [{ type: 'text' as const, text: `Error searching competitors: ${searchResult.error}` }],
      isError: true,
    };
  }

  if (searchResult.data.competitors.length === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No competitors found for that search query. Try a broader search.' }],
    };
  }

  // Step 2: Fetch reviews for each competitor
  const placeIds = searchResult.data.competitors.map((c) => c.placeId);
  const reviewsResult = await competitorService.getCompetitorReviews(
    placeIds,
    input.reviewsPerCompetitor ?? 20,
  );
  if (!reviewsResult.success || !reviewsResult.data) {
    return {
      content: [{ type: 'text' as const, text: `Error fetching competitor reviews: ${reviewsResult.error}` }],
      isError: true,
    };
  }

  // Step 3: Optionally include own business
  let ownBusiness: CompetitorReviewAnalysis | undefined;
  if (input.businessLocationName) {
    const ownReviews = await reviewService.getReviews(input.businessLocationName, { pageSize: 50 });
    const profile = await reviewService.getBusinessProfile(input.businessLocationName);

    if (ownReviews.success && ownReviews.data) {
      const businessName = profile.success && profile.data ? profile.data.displayName : 'Your Business';
      ownBusiness = buildOwnAnalysis(
        ownReviews.data.reviews,
        businessName,
        input.businessLocationName,
      );
    }
  }

  // Step 4: Generate insights
  const analyses = reviewsResult.data.analyses;
  const insights = generateInsights(analyses, ownBusiness);

  // Step 5: Format output
  const formattedCompetitors = analyses.map((c, i) => [
    `### ${i + 1}. ${c.businessName}`,
    `Rating: ${c.averageRating.toFixed(1)}/5.0 (${c.totalReviews} reviews)`,
    `Recent reviews (30d): ${c.recentReviewCount}`,
    c.topComplaints.length > 0
      ? `Top complaints: ${c.topComplaints.join(', ')}`
      : 'No notable complaints',
    c.topCompliments.length > 0
      ? `Top compliments: ${c.topCompliments.join(', ')}`
      : 'No notable compliments',
  ].join('\n'));

  const sections = [
    `## Competitor Analysis: "${input.query}"`,
    `Found ${analyses.length} competitor(s).`,
    '',
    ...formattedCompetitors,
  ];

  if (ownBusiness) {
    sections.push(
      '',
      '---',
      '### Your Business',
      `Rating: ${ownBusiness.averageRating.toFixed(1)}/5.0 (${ownBusiness.totalReviews} reviews)`,
      `Recent reviews (30d): ${ownBusiness.recentReviewCount}`,
    );
  }

  if (insights.length > 0) {
    sections.push(
      '',
      '### Insights',
      ...insights.map((i) => `- **${i.type}**: ${i.message}`),
    );
  }

  const output = {
    query: input.query,
    competitors: analyses,
    ownBusiness,
    insights,
  };

  return {
    content: [{ type: 'text' as const, text: sections.join('\n') }],
    structuredContent: output,
  };
}
