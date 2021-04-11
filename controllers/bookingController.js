const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
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
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/?tourId=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}&tourDate=${req.query.date}`,
    cancel_url: `${req.protocol}://${req.get('host')}/?tourId=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}&tourDate=${
      req.query.date
    }&cancel=true`,
  });

  // 3) Create session as respone
  res.status(200).json({
    status: 'success',
    session,
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //TODO: Unsecure: Everyone can make booking without paying, just hitting this endpoint
  const { tourId, user, price, tourDate, cancel } = req.query;

  //TODO: Temporary solution: A participant is deleted everytime you hit this endpoint with cancel=true
  if (cancel) {
    const tour = await Tour.findById(tourId);
    const formatedDate = new Date(tourDate).toString();
    const day = tour.startDates.findIndex(
      (element) => new Date(element).toString() === formatedDate
    );
    tour.participants = tour.participants.map((el, index) =>
      index === day ? el - 1 : el
    );
    await tour.save();

    //* JIJI you tricky boy :^)
    return res.redirect(`${req.protocol}://${req.get('host')}/`);
  }

  // No query string then next()
  if (!tourId && !user && !price && !tourDate) return next();
  await Booking.create({ tour: tourId, user, price, tourDate });

  // Redirect without query string
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;

  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
