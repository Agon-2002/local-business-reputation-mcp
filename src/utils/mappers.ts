import type { GoogleLocation, GoogleReview, GoogleReviewReply } from '../types/google-api.js';
import type { BusinessLocation, Review, ReviewReply } from '../types/domain.js';
import { starRatingToNumber } from './star-rating.js';
import type { StarRatingEnum } from './constants.js';

export function mapGoogleLocationToDomain(
  accountName: string,
  location: GoogleLocation,
): BusinessLocation {
  const address = location.storefrontAddress;

  return {
    name: `${accountName}/${location.name}`,
    displayName: location.title,
    phone: location.phoneNumbers?.primaryPhone,
    website: location.websiteUri,
    address: address
      ? {
          lines: address.addressLines ?? [],
          city: address.locality ?? '',
          state: address.administrativeArea ?? '',
          postalCode: address.postalCode ?? '',
          country: address.regionCode ?? '',
        }
      : undefined,
    category: location.primaryCategory?.displayName,
  };
}

function mapReplyToDomain(reply: GoogleReviewReply): ReviewReply {
  return {
    comment: reply.comment,
    updatedAt: reply.updateTime,
  };
}

export function mapGoogleReviewToDomain(
  locationName: string,
  review: GoogleReview,
): Review {
  const rating = review.starRating === 'STAR_RATING_UNSPECIFIED'
    ? 'ONE'
    : review.starRating;

  return {
    id: review.reviewId,
    name: review.name,
    locationName,
    reviewerName: review.reviewer.displayName,
    isAnonymous: review.reviewer.isAnonymous ?? false,
    stars: starRatingToNumber(rating as StarRatingEnum),
    starRating: rating,
    comment: review.comment ?? '',
    createdAt: review.createTime,
    updatedAt: review.updateTime,
    reply: review.reviewReply ? mapReplyToDomain(review.reviewReply) : undefined,
  };
}
