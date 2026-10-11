const service = require('../services/evidence-service');
function actorFrom(req) { return req.get('x-actor-id') || (req.body && req.body.registeredBy) || req.query.actor; }
function asyncRoute(fn) { return (req, res, next) => Promise.resolve(fn(req, res)).catch(next); }
module.exports = {
  register: asyncRoute(async (req, res) => { const evidence = await service.registerEvidence(req.body, req.requestId); res.status(201).json({ data: evidence, requestId: req.requestId }); }),
  list: asyncRoute(async (req, res) => { const result = await service.listEvidence(req.query); res.status(200).json({ data: result.items, pagination: result.pagination, requestId: req.requestId }); }),
  get: asyncRoute(async (req, res) => { const data = await service.getEvidence(req.params.id, actorFrom(req), req.requestId); res.status(200).json({ data, requestId: req.requestId }); }),
  verify: asyncRoute(async (req, res) => { const data = await service.verifyEvidence(req.params.id, actorFrom(req), req.requestId); res.status(data.status === 'verified' ? 200 : 409).json({ data, requestId: req.requestId }); }),
  custody: asyncRoute(async (req, res) => { const result = await service.listCustody(req.params.id, req.query); res.status(200).json({ data: result.items, pagination: result.pagination, requestId: req.requestId }); }),
  addCustodyNote: asyncRoute(async (req, res) => { const data = await service.addCustodyNote(req.params.id, req.body, req.requestId); res.status(201).json({ data, requestId: req.requestId }); })
};
