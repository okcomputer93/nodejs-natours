// eslint-disable-next-line arrow-body-style
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
//* To remember:
//* .catch(next) = catch(err => next(err))
//* DUHH
