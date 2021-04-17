const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/userModel');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (name, expiresIn) =>
  jwt.sign(name, process.env.JWT_SECRET, {
    expiresIn,
  });

const createSendToken = (token, res, cookieName, lifeTime = 24) => {
  const cookieOptions = {
    expires: new Date(Date.now() + lifeTime * 60 * 60 * 1000),
    // Only in encrypted conection
    secure: process.env.NODE_ENV === 'production',
    // Cannot be acced or modified
    httpOnly: true,
  };

  res.cookie(cookieName, token, cookieOptions);
};

const removeToken = (res, cookieName) => {
  res.cookie(cookieName, 'invalid', {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
};

const sendTokenAndResponse = (user, res) => {
  const token = signToken({ id: user._id }, process.env.JWT_EXPIRES_IN);

  createSendToken(token, res, 'jwt');

  // Remove password from output
  user.password = undefined;

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const sendConfirmationEmail = async (user, emailUrl, next) => {
  try {
    await new Email(user, emailUrl).sendConfirmEmail();
  } catch (error) {
    user.confirmEmailToken = undefined;
    user.emailTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
};

// This point is hitting after you are sure the jwt is expired
const refreshJWTToken = async (req, res, next) => {
  console.log('here?');
  let refreshToken;
  if (req.body.refreshToken) {
    // eslint-disable-next-line prefer-destructuring
    refreshToken = req.body.refreshToken;
  } else if (req.cookies.jwt) {
    // eslint-disable-next-line prefer-destructuring
    refreshToken = req.cookies.natoursrefreshtoken;
  }

  if (!refreshToken) return next(new AppError('JWT expired', 403));

  const refreshTokenEnc = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  const user = await User.findOne({
    _id: req.user.id,
    refreshToken: refreshTokenEnc,
  });

  if (!user) return next(new AppError('Invalid refresh token'));
  const jwtToken = signToken({ id: user.id }, process.env.JWT_EXPIRES_IN);
  createSendToken(jwtToken, res, 'jwt', process.env.REFRESHTOKEN_EXPIRES_IN);
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  // 1) Generate the random email token
  const emailToken = newUser.createConfirmEmailToken();
  // I'm not validating on save
  await newUser.save({
    validateBeforeSave: false,
  });
  const confirmEmailUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/confirmEmail/${emailToken}`;

  await sendConfirmationEmail(newUser, confirmEmailUrl, next);

  const token = signToken(
    { email: newUser.email },
    process.env.NOCONFIRMATIONEMAIL_EXPIRES_IN
  );

  createSendToken(token, res, 'natoursnoemail', 24);

  res.status(200).json({
    status: 'success',
    message: 'Confirmation sent to email!',
  });
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    confirmEmailToken: hashedToken,
    emailTokenExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.confirmEmailToken = undefined;
  user.emailTokenExpires = undefined;
  user.emailConfirmedAt = Date.now();
  const refreshToken = user.createRefreshToken();
  await user.save({ validateBeforeSave: false });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcome();

  // Send refreshtoken as a cookie
  createSendToken(refreshToken, res, 'natoursrefreshtoken', 24);
  const token = signToken({ id: user._id }, process.env.JWT_EXPIRES_IN);

  createSendToken(token, res, 'jwt');

  removeToken(res, 'natoursnoemail');

  user.refreshToken = undefined;

  res.status(201).json({
    status: 'success',
    refreshToken,
    token,
    data: {
      user,
    },
  });
});

exports.resendConfirmationEmail = catchAsync(async (req, res, next) => {
  // Only in views works resendEmail, not in the API
  const { userEmail } = req;

  const user = await User.findOne({ email: userEmail });
  const emailToken = user.createConfirmEmailToken();
  await user.save({
    validateBeforeSave: false,
  });
  const confirmEmailUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/confirmEmail/${emailToken}`;
  sendConfirmationEmail(user, confirmEmailUrl, next);

  res.status(200).json({
    status: 'success',
    message: 'Confirmation sent to email!',
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  // correctPassword is an instance method, see: userModel.js

  if (!user || !(await user.correctPassword(password, user.password))) {
    // Be vague on description -> email or password
    return next(new AppError('Incorrect email or password'), 401);
  }

  // User has confirmed its email?
  if (!user.emailConfirmedAt) {
    // Send cookie
    // I CURSE YOU!
    const token = signToken(
      { email: user.email },
      process.env.NOCONFIRMATIONEMAIL_EXPIRES_IN
    );

    createSendToken(token, res, 'natoursnoemail', 24);

    return next(new AppError('Please confirm your email before login!', 403));
  }

  // 3) If everything ok, send token to client
  // But before remove the curse!
  removeToken(res, 'natoursnoemail');

  // Send refreshtoken as a cookie
  const refreshToken = user.createRefreshToken();
  await user.save({ validateBeforeSave: false });
  createSendToken(refreshToken, res, 'natoursrefreshtoken', 24);
  const token = signToken({ id: user._id }, process.env.JWT_EXPIRES_IN);

  createSendToken(token, res, 'jwt');

  // Remove password from output
  user.password = undefined;
  user.refreshToken = undefined;

  res.status(200).json({
    status: 'success',
    refreshToken,
    token,
    data: {
      user,
    },
  });
});

exports.restrictToNoEmailConfirmed = catchAsync(async (req, res, next) => {
  const token = req.cookies.natoursnoemail;

  // Put logged user in locals
  const jwtCookie = req.cookies.jwt;

  if (jwtCookie) {
    const decoded = await promisify(jwt.verify)(
      jwtCookie,
      process.env.JWT_SECRET
    );

    const currentUser = await User.findById(decoded.id);
    res.locals.user = currentUser;
  }

  if (!token) {
    return next(new AppError('You are not authorized.', 403));
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if user still exists
  const currentUser = await User.findOne({ email: decoded.email });
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  req.userEmail = decoded.email;
  next();
});

exports.restrictForPurchased = catchAsync(async (req, res, next) => {
  // Tour exists?
  const bookings = await Booking.find({ user: req.user.id });
  const tour = await Tour.findById(req.body.tour);
  const isTourPurchased = bookings.find(
    (booking) => booking.tour.id === tour.id
  );
  if (!isTourPurchased)
    return next(new AppError('You can only review purchased tours!'));
  next();
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 403)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET, {
    ignoreExpiration: true,
  });
  // console.log(decoded);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  // I wanna know if the user changed its password after log in
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Use recently changed password! Please log in again.', 401)
    );
  }
  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;

  if (
    decoded.exp < Date.now() &&
    !req.body.refreshToken &&
    !req.cookies.natoursrefreshtoken
  )
    return next(new AppError('JWT expired', 403));
  if (decoded.exp < Date.now()) await refreshJWTToken(req, res, next);
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check if it's there
  if (req.cookies.jwt) {
    try {
      // 2) Verification token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
        { ignoreExpiration: true }
      );
      // console.log(decoded);

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next(
          new AppError(
            'The user belonging to this token does no longer exist.',
            401
          )
        );
      }

      // 4) Check if user changed password after the token was issued
      // I wanna know if the user changed its password after log in
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // There is a logged in user
      res.locals.user = currentUser;
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  }
  next();
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  // Send the original token (not the encrypted one)
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired an there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired'), 400);
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  //4) Log the user in, send JWT
  sendTokenAndResponse(user, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  user.refreshToken = undefined;
  user.save({ validateBeforeSave: false });
  removeToken(res, 'jwt');
  removeToken(res, 'natoursrefreshtoken');
  res.status(200).json({ status: 'success' });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  sendTokenAndResponse(user, res);
});
