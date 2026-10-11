const service = require('../services/correlation-engine');
async function correlate(req, res, next) {
  try { res.status(200).json({ ...await service.correlateEvent(req.params.eventId, req.body || {}), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
async function list(req, res, next) {
  try { res.status(200).json({ ...await service.listCorrelations(req.query), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
async function review(req, res, next) {
  try { res.status(200).json({ data: await service.reviewCorrelation(req.params.id, req.body), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
module.exports = { correlate, list, review };
