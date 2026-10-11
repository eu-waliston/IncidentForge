const service = require('../services/incident-service');

async function create(req, res, next) {
  try { const incident = await service.createIncident(req.body); res.status(201).json({ data: incident, requestId: req.requestId }); }
  catch (error) { next(error); }
}
async function list(req, res, next) {
  try { const result = await service.listIncidents(req.query); res.status(200).json({ data: result.items, pagination: result.pagination, requestId: req.requestId }); }
  catch (error) { next(error); }
}
async function getById(req, res, next) {
  try { const incident = await service.getIncident(req.params.id); res.status(200).json({ data: incident, requestId: req.requestId }); }
  catch (error) { next(error); }
}
async function update(req, res, next) {
  try { const incident = await service.updateIncident(req.params.id, req.body); res.status(200).json({ data: incident, requestId: req.requestId }); }
  catch (error) { next(error); }
}
async function transition(req, res, next) {
  try { const incident = await service.transitionIncident(req.params.id, req.body); res.status(200).json({ data: incident, requestId: req.requestId }); }
  catch (error) { next(error); }
}
module.exports = { create, list, getById, update, transition };
