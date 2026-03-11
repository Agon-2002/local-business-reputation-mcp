import Outscraper from 'outscraper';
import type { OutscraperPlace, OutscraperPlaceWithReviews } from '../types/outscraper-api.js';
import { logger } from '../utils/logger.js';

export class OutscraperClient {
  private readonly client: InstanceType<typeof Outscraper>;

  constructor(apiKey: string) {
    this.client = new Outscraper(apiKey);
  }

  async searchPlaces(query: string, limit: number = 10): Promise<OutscraperPlace[]> {
    try {
      const response = await this.client.googleMapsSearch([query], limit, 'en', null);
      // Response is [[place1, place2, ...]] (nested array per query)
      return (response?.[0] ?? []) as OutscraperPlace[];
    } catch (err) {
      logger.error('Outscraper searchPlaces failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  async getReviews(
    placeIds: string[],
    reviewsLimit: number = 20,
  ): Promise<OutscraperPlaceWithReviews[]> {
    try {
      const response = await this.client.googleMapsReviews(placeIds, reviewsLimit);
      return (response ?? []) as OutscraperPlaceWithReviews[];
    } catch (err) {
      logger.error('Outscraper getReviews failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}
