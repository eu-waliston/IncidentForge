const express = require('express');
const controller = require('../controllers/risk-controller');
const router = express.Router();
router.post('/events/:eventId/assess', controller.assessEvent);
module.exports = router;
