const service = require('../services/event-ingestion-service');
const { httpError } = require('../utils/http-error');

async function ingest(req, res, next) {
  try {
    const result = await service.ingestOne(req.body);
    res.status(result.duplicate ? 200 : 201).json({ data: result.event, meta: { duplicate: result.duplicate, requestId: req.requestId } });
  } catch (error) { next(error); }
}
async function ingestBatch(req, res, next) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || !Array.isArray(req.body.events)) {
      throw httpError(400, 'INVALID_BATCH_BODY', 'Body must be an object containing an events array.');
    }
    const result = await service.ingestBatch(req.body.events);
    res.status(result.summary.rejected === result.summary.received ? 400 : 207).json({ ...result, meta: { requestId: req.requestId } });
  } catch (error) { next(error); }
}
async function list(req, res, next) {
  try { res.status(200).json({ ...await service.listEvents(req.query), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
async function getById(req, res, next) {
  try { res.status(200).json({ data: await service.getEventById(req.params.id), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
module.exports = { ingest, ingestBatch, list, getById };
