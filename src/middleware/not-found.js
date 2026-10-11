function notFound(req, res) {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: 'The requested resource was not found.' },
    requestId: req.requestId
  });
}
module.exports = { notFound };
