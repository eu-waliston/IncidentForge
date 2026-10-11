const service = require('../services/risk-engine');
async function assessEvent(req, res, next) {
  try { res.status(200).json({ ...await service.assessEvent(req.params.eventId), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
module.exports = { assessEvent };
