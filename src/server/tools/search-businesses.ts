import type { IReviewService } from '../../types/service.js';

export interface SearchBusinessesInput {
  query: string;
  limit?: number;
}

export async function handleSearchBusinesses(service: IReviewService, input: SearchBusinessesInput) {
  const result = await service.searchBusinesses(input.query, input.limit ?? 5);

  if (!result.success || !result.data) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${result.error}` }],
      isError: true,
    };
  }

  const { businesses } = result.data;

  if (businesses.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'No businesses found for that search. Try a more specific query including the business name and city.',
      }],
    };
  }

  const formatted = businesses.map((biz) => {
    const ratingStr = biz.rating ? ` | Rating: ${biz.rating.toFixed(1)}/5.0` : '';
    const reviewStr = biz.reviewCount ? ` (${biz.reviewCount} reviews)` : '';
    const parts = [
      `**${biz.displayName}**${ratingStr}${reviewStr}`,
      biz.category ? `  Category: ${biz.category}` : null,
      biz.fullAddress ? `  Address: ${biz.fullAddress}` : null,
      biz.phone ? `  Phone: ${biz.phone}` : null,
      biz.website ? `  Website: ${biz.website}` : null,
      `  Place ID: \`${biz.placeId}\``,
    ].filter(Boolean);
    return parts.join('\n');
  });

  const output = {
    businesses: businesses.map((biz) => ({
      placeId: biz.placeId,
      displayName: biz.displayName,
      fullAddress: biz.fullAddress,
      phone: biz.phone,
      website: biz.website,
      category: biz.category,
      rating: biz.rating,
      reviewCount: biz.reviewCount,
    })),
    totalCount: businesses.length,
  };

  return {
    content: [{
      type: 'text' as const,
      text: `Found ${businesses.length} business(es):\n\n${formatted.join('\n\n')}`,
    }],
    structuredContent: output,
  };
}
