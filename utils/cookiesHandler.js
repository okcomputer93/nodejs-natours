class Cookies {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  push(val, name, lifeTime = 24) {
    const cookieOptions = {
      expires: new Date(Date.now() + lifeTime * 60 * 60 * 1000),
      secure:
        this.req.secure || this.req.headers('x-forwarded-proto') === 'https',
      httpOnly: true,
    };
    this.res.cookie(name, val, cookieOptions);
  }

  pull(name) {
    this.res.cookie(name, 'invalid', {
      expires: new Date(Date.now()),
      httpOnly: true,
    });
  }

  get(name) {
    return this.req.cookies[name];
  }

  exist(name) {
    return Object.prototype.hasOwnProperty.call(this.req.cookies, name);
  }
}

module.exports = Cookies;
