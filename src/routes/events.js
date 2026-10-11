const express = require('express');
const controller = require('../controllers/event-controller');
const router = express.Router();
router.post('/', controller.ingest);
router.post('/batch', controller.ingestBatch);
router.get('/', controller.list);
router.get('/:id', controller.getById);
module.exports = router;
