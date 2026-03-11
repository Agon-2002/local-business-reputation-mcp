import { describe, it, expect } from 'vitest';
import { MockReviewService } from '../../../src/services/mock-review-service.js';
import { handleListLocations } from '../../../src/server/tools/list-locations.js';

describe('list_locations tool', () => {
  const service = new MockReviewService();

  it('returns all mock locations', async () => {
    const result = await handleListLocations(service);

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Found 3 business location(s)');
    expect(result.content[0].text).toContain('Bella Vista Italian Restaurant');
    expect(result.content[0].text).toContain('Glow Beauty Salon');
    expect(result.content[0].text).toContain('Bright Smile Dental');
  });

  it('returns structured content with location data', async () => {
    const result = await handleListLocations(service);
    const structured = result.structuredContent as { locations: Array<{ name: string; displayName: string }>; totalCount: number };

    expect(structured.totalCount).toBe(3);
    expect(structured.locations).toHaveLength(3);
    expect(structured.locations[0].name).toBe('accounts/123/locations/456');
    expect(structured.locations[0].displayName).toBe('Bella Vista Italian Restaurant');
  });

  it('includes address and phone in text output', async () => {
    const result = await handleListLocations(service);

    expect(result.content[0].text).toContain('123 Main Street');
    expect(result.content[0].text).toContain('+1-555-0101');
  });

  it('includes resource IDs for each location', async () => {
    const result = await handleListLocations(service);

    expect(result.content[0].text).toContain('accounts/123/locations/456');
    expect(result.content[0].text).toContain('accounts/123/locations/789');
    expect(result.content[0].text).toContain('accounts/123/locations/012');
  });
});
