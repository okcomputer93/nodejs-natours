<template lang="pug">
  .app
    .reviews-list
      div(v-if="isLoading")
        loading-spinner
      h2.heading-secondary(v-if="isEmpty") Such empty! Book a tour and review it!
      review(v-for="review in reviews",
        :key="review.id",
        :review="review"
        @update="updateReview"
        v-else)
    
</template>

<script>
import Review from './components/Review';
import LoadingSpinner from './components/LoadingSpinner';
export default {
  name: 'App',
  components: {
    Review,
    LoadingSpinner,
  },
  data() {
    return {
      isLoading: true,
      isEmpty: false,
      reviews: [],
    };
  },
  methods: {
    async updateReview(body, reviewId) {
      const reviewIndex = this.reviews.findIndex(
        (review) => review.id === reviewId
      );
      try {
        const response = await fetch(
          `http://127.0.0.1:3000/api/v1/reviews/${reviewId}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'PATCH',
            body: JSON.stringify(body),
          }
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        this.reviews[reviewIndex].message =
          'success/Review successfully updated.';
        setTimeout(() => (this.reviews[reviewIndex].message = ''), 3000);
      } catch (error) {
        this.reviews[reviewIndex].message = `error/${error}`;
        setTimeout(() => (this.reviews[reviewIndex].message = ''), 3000);
        return;
      }
    },
  },
  async created() {
    const response = await fetch(
      'http://127.0.0.1:3000/api/v1/reviews/my-reviews'
    );
    const data = await response.json();
    const reviews = data.data.reviews.map((review) => {
      return {
        id: review.id,
        rating: review.rating,
        review: review.review,
        tourId: review.tour.id,
        tourName: review.tour.name,
        tourSlug: review.tour.slug,
        tourImage: review.tour.images[0],
        message: '',
      };
    });

    this.reviews = reviews;
    this.isLoading = false;
    this.isEmpty = reviews.length <= 0;
  },
};
</script>

<style>
.reviews-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.reviews-list > *:not(:last-child) {
  margin-bottom: 8rem;
}
</style>
