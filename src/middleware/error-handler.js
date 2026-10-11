function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.code === 11000) {
    err.statusCode = 409;
    err.code = 'DUPLICATE_EVENT';
    err.message = 'An event with this source and sourceEventId already exists.';
  }
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.name === 'StrictModeError') {
    err.statusCode = 400;
    err.code = err.code || 'VALIDATION_ERROR';
    err.message = err.name === 'ValidationError' ? 'The supplied data failed validation.' : 'The supplied data is invalid.';
  }
  const status = Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode <= 599
    ? err.statusCode : 500;
  console.error({ level: 'error', requestId: req.requestId, method: req.method, path: req.path, status, message: err.message });
  res.status(status).json({
    error: {
      code: status === 500 ? 'INTERNAL_SERVER_ERROR' : (err.code || 'REQUEST_ERROR'),
      message: status === 500 ? 'An unexpected error occurred.' : err.message
    },
    requestId: req.requestId
  });
}
module.exports = { errorHandler };
