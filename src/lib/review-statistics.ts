import type {
	Review,
	ReviewRatingStatistics,
} from "@commercetools/platform-sdk";
import type { AbstractStorage } from "../storage/index.ts";

export class ReviewStatisticsService {
	constructor(private _storage: AbstractStorage) {}

	calculateProductReviewStatistics(
		projectKey: string,
		productId: string,
	): ReviewRatingStatistics | undefined {
		// Get all reviews for this product
		const allReviews = this._storage.all(projectKey, "review") as Review[];
		const productReviews = allReviews.filter(
			(review) =>
				review.target?.typeId === "product" &&
				review.target?.id === productId &&
				review.includedInStatistics &&
				review.rating !== undefined,
		);

		if (productReviews.length === 0) {
			return undefined;
		}

		const ratings = productReviews
			.map((review) => review.rating!)
			.filter((rating) => rating !== undefined);

		if (ratings.length === 0) {
			return undefined;
		}

		// Calculate statistics
		const count = ratings.length;
		const sum = ratings.reduce((acc, rating) => acc + rating, 0);
		const averageRating = Math.round((sum / count) * 100000) / 100000; // Round to 5 decimals
		const highestRating = Math.max(...ratings);
		const lowestRating = Math.min(...ratings);

		// Calculate ratings distribution
		const ratingsDistribution: { [key: string]: number } = {};
		for (const rating of ratings) {
			const key = rating.toString();
			ratingsDistribution[key] = (ratingsDistribution[key] || 0) + 1;
		}

		return {
			averageRating,
			highestRating,
			lowestRating,
			count,
			ratingsDistribution,
		};
	}
}
