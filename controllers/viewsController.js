const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  res.locals.alert =
    alert === 'booking'
      ? "Your booking was succesfull! Please check your email for confirmation. If your booking doesn't show up here immediatly, please come back later."
      : null;
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3) Render that template using tour data from 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  if (res.locals.user) {
    const expiredTour = !!(await Booking.findOne({
      user: res.locals.user.id,
      tour: tour.id,
      tourDate: { $lt: Date.now() },
    }));
    const isReviewed =
      (
        await Review.find({
          user: res.locals.user.id,
          tour: tour.id,
        })
      ).length > 0;
    res.locals.user.isReviewable = expiredTour && !isReviewed;
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignUpForm = (req, res) => {
  res.status(200).render('signUp', {
    title: 'Signup',
  });
};

exports.getAccount = (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) find all bookings
  const bookings = await Booking.find({ user: req.user.id });
  // For virtual populate
  // .populate({
  //   path: 'bookings',
  // });

  // 2) find tours with the returned IDs
  const tourIds = bookings.map((booking) => booking.tour);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  // For virtual populate
  // const tours = bookings.map((booking) => booking.tour);

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.getMyFavTours = catchAsync(async (req, res, next) => {
  const favToursId = (await User.findById(req.user.id)).favTours;

  const favTours = await Tour.find({ _id: { $in: favToursId } });

  res.status(200).render('overview', {
    title: 'Tours I love',
    tours: favTours,
  });
});

exports.getMyReviews = catchAsync(async (req, res, next) => {
  res.status(200).render('reviews', {
    title: 'My reviews',
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      runValidators: true,
    }
  );
  res.status(301).redirect('/me');
});

exports.getEmailConfirmationForm = catchAsync(async (req, res, next) => {
  //Get user based on confirm-email cookie

  res.status(200).render('confirmEmail', {
    title: 'Confirm Your Email',
  });
});

exports.confirmEmailResponse = async (req, res, next) => {
  res.status(200).redirect('/me');
};

// Thanks for responding. I used your suggestion for a while and it worked great, then as I progressed through the course, there were still issues. I have put together a singular content security policy inside my app.js as follows:

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
//         baseUri: ["'self'"],
//         fontSrc: ["'self'", 'https:', 'data:'],
//         scriptSrc: [
//           "'self'",
//           'https:',
//           'http:',
//           'blob:',
//           'https://*.mapbox.com',
//           'https://js.stripe.com',
//           'https://m.stripe.network',
//           'https://*.cloudflare.com',
//         ],
//         frameSrc: ["'self'", 'https://js.stripe.com'],
//         objectSrc: ["'none'"],
//         styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
//         workerSrc: [
//           "'self'",
//           'data:',
//           'blob:',
//           'https://*.tiles.mapbox.com',
//           'https://api.mapbox.com',
//           'https://events.mapbox.com',
//           'https://m.stripe.network',
//         ],
//         childSrc: ["'self'", 'blob:'],
//         imgSrc: ["'self'", 'data:', 'blob:'],
//         formAction: ["'self'"],
//         connectSrc: [
//           "'self'",
//           "'unsafe-inline'",
//           'data:',
//           'blob:',
//           'https://*.stripe.com',
//           'https://*.mapbox.com',
//           'https://*.cloudflare.com/',
//           'https://bundle.js:*',
//           'ws://127.0.0.1:*/',

//         ],
//         upgradeInsecureRequests: [],
//       },
//     },
//   })
// );
