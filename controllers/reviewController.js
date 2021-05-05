const Review = require('../models/reviewModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');

exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // req.user comes from authController.protect
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getMyReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find({ user: req.user.id }).populate({
    path: 'tour',
    select: 'name images slug',
  });
  res.status(200).json({
    status: 'success',
    data: {
      reviews,
    },
  });
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
