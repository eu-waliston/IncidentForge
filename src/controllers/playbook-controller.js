const service = require('../services/playbook-service');
async function list(req, res, next) {
  try { res.status(200).json({ ...await service.listPlaybooks(), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
async function run(req, res, next) {
  try { res.status(201).json({ ...await service.runPlaybook(req.params.key, req.body || {}), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
async function listRuns(req, res, next) {
  try { res.status(200).json({ ...await service.listRuns(req.query), meta: { requestId: req.requestId } }); }
  catch (error) { next(error); }
}
module.exports = { list, run, listRuns };
