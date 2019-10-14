// catchAsync is a general wraper for async functions which returns errors for rejected promises. the function which this catchAsync function wrapps, is doing its job normally. only in case of a rejection this wrapper will respond by catching the error. then it calls next(err) with the error inside the next ans so trigger the error handler middleware which lives in errorController.
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
