// Raw Outscraper API response types

export interface OutscraperPlace {
  query: string;
  name: string;
  place_id: string;
  google_id: string;
  full_address: string;
  rating: number;
  reviews: number;
  phone?: string;
  site?: string;
  type?: string;
  subtypes?: string[];
}

export interface OutscraperReview {
  author_title: string;
  author_id: string;
  review_text: string;
  review_rating: number;
  review_timestamp: number;
  review_datetime_utc: string;
  review_likes: number;
  owner_answer?: string;
  owner_answer_timestamp?: number;
}

export interface OutscraperPlaceWithReviews extends OutscraperPlace {
  reviews_data: OutscraperReview[];
}
