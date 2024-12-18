const express = require('express');
const router = express.Router();
const currentDataController = require('../controllers/currentDataController');

//GET /api/coins/:name
router.get('/price/:name', currentDataController.currentAssetPrice);

router.get('/complete_report/:name', currentDataController.completeAssetReport);

module.exports = router;