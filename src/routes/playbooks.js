const express = require('express');
const controller = require('../controllers/playbook-controller');
const router = express.Router();
router.get('/', controller.list);
router.post('/:key/run', controller.run);
router.get('/runs', controller.listRuns);
module.exports = router;
