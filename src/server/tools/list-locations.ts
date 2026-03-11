import type { IReviewService } from '../../types/service.js';

export async function handleListLocations(service: IReviewService) {
  const result = await service.listLocations();

  if (!result.success || !result.data) {
    return {
      content: [{ type: 'text' as const, text: `Error: ${result.error}` }],
      isError: true,
    };
  }

  const { locations } = result.data;

  if (locations.length === 0) {
    return {
      content: [{
        type: 'text' as const,
        text: 'No business locations found. Make sure your Google Business Profile is verified and linked to this account.',
      }],
    };
  }

  const formatted = locations.map((loc) => {
    const parts = [
      `**${loc.displayName}**`,
      loc.category ? `  Category: ${loc.category}` : null,
      loc.address ? `  Address: ${loc.address.lines.join(', ')}, ${loc.address.city}, ${loc.address.state} ${loc.address.postalCode}` : null,
      loc.phone ? `  Phone: ${loc.phone}` : null,
      loc.website ? `  Website: ${loc.website}` : null,
      `  Resource ID: \`${loc.name}\``,
    ].filter(Boolean);
    return parts.join('\n');
  });

  const output = {
    locations: locations.map((loc) => ({
      name: loc.name,
      displayName: loc.displayName,
      phone: loc.phone,
      website: loc.website,
      address: loc.address,
      category: loc.category,
    })),
    totalCount: locations.length,
  };

  return {
    content: [{
      type: 'text' as const,
      text: `Found ${locations.length} business location(s):\n\n${formatted.join('\n\n')}`,
    }],
    structuredContent: output,
  };
}
