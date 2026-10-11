const express = require('express');
const controller = require('../controllers/incident-controller');
const router = express.Router();
router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.patch('/:id/status', controller.transition);
router.patch('/:id', controller.update);
module.exports = router;
