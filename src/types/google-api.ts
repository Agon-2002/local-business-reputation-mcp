// Raw Google Business Profile API response types
// Matches API v4/v1 response shapes exactly

export type GoogleStarRating =
  | 'STAR_RATING_UNSPECIFIED'
  | 'ONE'
  | 'TWO'
  | 'THREE'
  | 'FOUR'
  | 'FIVE';

export interface GoogleReviewer {
  profilePhotoUrl?: string;
  displayName: string;
  isAnonymous?: boolean;
}

export interface GoogleReviewReply {
  comment: string;
  updateTime: string;
}

export interface GoogleReview {
  reviewId: string;
  name: string; // accounts/xxx/locations/yyy/reviews/zzz
  reviewer: GoogleReviewer;
  starRating: GoogleStarRating;
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: GoogleReviewReply;
}

export interface GoogleListReviewsResponse {
  reviews?: GoogleReview[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
}

export interface GooglePostalAddress {
  addressLines?: string[];
  locality?: string;
  administrativeArea?: string;
  postalCode?: string;
  regionCode?: string;
}

export interface GoogleLocation {
  name: string; // locations/yyy
  title: string;
  storefrontAddress?: GooglePostalAddress;
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
  };
  primaryCategory?: {
    displayName: string;
  };
}

export interface GoogleListLocationsResponse {
  locations?: GoogleLocation[];
  nextPageToken?: string;
  totalSize?: number;
}

export interface GoogleAccount {
  name: string; // accounts/xxx
  accountName: string;
  type: string;
}

export interface GoogleListAccountsResponse {
  accounts?: GoogleAccount[];
  nextPageToken?: string;
}

export interface GoogleUpdateReplyResponse {
  comment: string;
  updateTime: string;
}
