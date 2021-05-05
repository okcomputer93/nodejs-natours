<template lang="pug">
  form.review(@mouseover="isHover = true", @mouseout="isHover = false" :class="isHover ? 'is-hover' : ''")
    a.heading-secondary.review__tour(v-text="review.tourName", :href="`/tour/${review.tourSlug}`")
    .stars__rate--review
      svg.star__selectable--review(aria-selected="true", v-for="(starClass, index) in starsClass", :class="starClass", @click="newRating(maxRating - index)")
        use(:xlink:href="'../img/icons.svg#icon-fillable-star'")
    .review__body
      img.review__tour-img(:src="`../img/tours/${review.tourImage}`")
      textarea.review__content(minlength="10",rows="5", v-model="content") 
    p.review__message(v-text="messageContent || errorContent",:class="messageClass || errorClass")
    .review__btn-update
      button.btn--review.btn--green.btn--small(type="submit", v-visible="isHover", aria-hidden="true", @click.prevent="updateReview") Update
</template>

<script>
export default {
  name: 'Review',
  props: ['review'],
  data() {
    return {
      maxRating: 5,
      isHover: false,
      content: '',
      stars: null,
    };
  },
  computed: {
    starsClass() {
      return Array(this.maxRating)
        .fill('')
        .map((_, index) => {
          if (index <= this.stars - 1) return 'star__selected';
          return '';
        })
        .reverse();
    },
    messageClass() {
      if (this.review.message) return `is-${this.review.message.split('/')[0]}`;
    },
    messageContent() {
      if (this.review.message) return this.review.message.split('/')[1];
    },
    errorContent() {
      if (this.content === '' || !this.stars)
        return 'Please provide a review and a rating.';
    },
    errorClass() {
      if (this.content === '' || !this.stars) return 'is-error';
    },
  },
  methods: {
    newRating(rating) {
      this.stars = rating;
    },
    updateReview() {
      this.$emit(
        'update',
        {
          review: this.content,
          rating: this.stars,
        },
        this.review.id
      );
    },
  },
  mounted() {
    this.content = this.review.review;
    this.stars = this.review.rating;
  },
};
</script>

<style scoped>
.review {
  width: 60%;
  background-color: #fff;
  padding: 5rem 5rem 3rem;
  transform: skewX(-15deg);
  border-top-left-radius: 10rem;
  border-bottom-right-radius: 10rem;
  transition: 0.4s all ease-in;
  position: relative;
}

.review > * {
  transform: skewX(15deg);
}

.review__tour {
  padding-bottom: 1rem;
  text-decoration: none;
  display: inline-block;
}

.review__body {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.review__tour-img {
  display: block;
  width: 15rem;
  height: 15rem;
  border-radius: 100%;
  flex: none;
}

.review__content {
  border: 1px transparent solid;
  padding: 1.5rem;
  width: 80%;
  font-family: 'Lato', sans-serif;
  font-size: 1.5rem;
  line-height: 1.6;
  flex-grow: 1;
  margin-left: 3rem;
  transition: 0.4s all ease-in;
}

.review__message {
  position: absolute;
  font-size: 1.5rem;
  line-height: 1.6;
  padding: 2rem;
}

.review__content:focus {
  outline: none;
  border: 1px #d3d3d3 solid;
}

.review__btn-update {
  display: flex;
  flex-direction: row-reverse;
  padding-top: 3rem;
}

.stars__rate--review {
  padding: 0.5rem 0 1rem;
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
  align-items: center;
}

.star__selectable--review {
  color: #adadad;
  width: 2.5rem;
  height: 2.5rem;
  cursor: pointer;
}

.star__selectable--review:hover {
  color: #20bf6b;
}

.star__selected {
  color: #20bf6b !important;
}

.star__selectable--review:hover ~ .star__selectable--review {
  color: #20bf6b;
}

.btn--review {
  font-size: 1.6rem;
  padding: 1.4rem 3rem;
  border-radius: 10rem;
  text-transform: uppercase;
  display: inline-block;
  text-decoration: none;
  position: relative;
  font-weight: 400;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  /*Add later when we use this for the button in form*/
  border: none;
  cursor: pointer;
}

.is-hover {
  background-color: #e2e2e2 !important;
}

.is-hover .review__content {
  background-color: #d3d3d3 !important;
}

.is-error {
  color: #e76b5a;
}

.is-success {
  color: #20bf6b;
}
</style>
