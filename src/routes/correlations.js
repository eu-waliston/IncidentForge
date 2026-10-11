const express = require('express');
const controller = require('../controllers/correlation-controller');
const router = express.Router();
router.post('/events/:eventId/run', controller.correlate);
router.get('/', controller.list);
router.patch('/:id/review', controller.review);
module.exports = router;
