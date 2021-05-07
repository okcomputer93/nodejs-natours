const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function (val) {
        return validator.isEmail(val);
      },
      message: 'Please provide a valid email',
    },
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This Only works on SAVE!!!!!
      validator: function (password) {
        return password === this.password;
      },
      message: "Passwords don't match",
    },
  },
  favTours: [{ type: mongoose.Schema.ObjectId, ref: 'Tour' }],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  confirmEmailToken: String,
  emailTokenExpires: Date,
  emailConfirmedAt: Date,
  refreshToken: String,
  twoFactorAuthenticationCode: String,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // We no longer need passwordConfirm in DB
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to current query
  this.find({ active: { $ne: false } });
  next();
});

// Instance method: is available on all documents of certain collection
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Did the user change the password after log in?
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = +(this.passwordChangedAt.getTime() / 1000);
    //  when token is issued (log in timestamp) < when the password changed
    return JWTTimestamp < changedTimestamp; // 100 < 200
  }

  // True means CHANGED
  // False means NOT changed
  return false;
};

const crypToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypToken(resetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.createConfirmEmailToken = function () {
  const emailToken = crypto.randomBytes(32).toString('hex');
  this.confirmEmailToken = crypToken(emailToken);
  this.emailTokenExpires = Date.now() + 10 * 60 * 1000;
  return emailToken;
};

userSchema.methods.createRefreshToken = function () {
  // resfreshToken has no expiration date in db,
  // If you want invalidate it, do it directly in DB
  const refreshToken = crypto.randomBytes(32).toString('hex');
  this.refreshToken = crypToken(refreshToken);
  return refreshToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
