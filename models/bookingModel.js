const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'A booking must belong to a Tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'A booking must belong to a User'],
  },
  price: {
    type: Number,
    require: [true, 'Booking must hava a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    // Warning: for virtual populate applications, comment this part
    select: 'name',
  });
  next();
});

// For virtual populate
// bookingSchema.virtual('bookings', {
//   ref: 'Tour',
//   foreignField: '_id',
//   localField: 'tour',
// });

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
