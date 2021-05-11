const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // Update participants on date
  const { date } = req.query;
  if (!date) return next(new AppError('Please provide a valid date', 403));

  const formatedDate = new Date(date).toString();
  const day = tour.startDates.findIndex(
    (element) => new Date(element).toString() === formatedDate
  );
  if (day === -1) return next(new AppError('Please provide a valid date', 403));

  if (tour.participants[day] >= tour.maxPerDay[day])
    return next(new AppError('Sorry, this date is booked out!', 403));
  tour.participants = tour.participants.map((el, index) =>
    index === day ? el + 1 : el
  );
  await tour.save();
  const printableDate = formatedDate.toLocaleString('en-us', {
    month: 'long',
    year: 'numeric',
  });

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: `${tour.summary} on ${printableDate}`,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${
                tour.imageCover
              }`,
            ],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      tour_date: date,
    },
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/?tourId=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}&tourDate=${req.query.date}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/`,
  });

  // 3) Create session as respone
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;

  if (!req.body.user) req.body.user = req.user.id;

  next();
};

const createBookingCheckout = async (session) => {
  const tourId = session.client_reference_id;
  const userId = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  const tourDate = session.metadata.tour_date;
  await Booking.create({ tour: tourId, user: userId, price, tourDate });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }
  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

const cancelIntent = async (session) => {
  const tourId = session.client_reference_id;
  const tourDate = session.metadata.tour_date;
  const tour = await Tour.findById(tourId);
  const formatedDate = new Date(tourDate).toString();
  const day = tour.startDates.findIndex(
    (element) => new Date(element).toString() === formatedDate
  );
  tour.participants = tour.participants.map((el, index) => {
    if (index === day) return el > 0 ? el - 1 : 0;
    return el;
  });
  await tour.save();
};

exports.webhookCancelIntent = (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_CANCEL_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook error: ${error.message}`);
  }
  cancelIntent(event.data.object);
  res.status(200).json({ received: true });
};

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
