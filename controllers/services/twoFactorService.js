const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

exports.getTwoFactorAuthenticationCode = (userEmail) => {
  const secretCode = speakeasy.generateSecret({
    name: `${process.env.APP_NAME}(${userEmail})`,
  });
  return {
    otpauthUrl: secretCode.otpauth_url,
    base32: secretCode.base32,
  };
};

exports.respondWithQRCode = (data, res) => {
  QRCode.toFileStream(res, data);
};

exports.verifyTwoFactorAuthenticationCode = (authToken, userToken) =>
  speakeasy.totp.verify({
    secret: userToken,
    encoding: 'base32',
    token: authToken,
    window: 0,
  });
