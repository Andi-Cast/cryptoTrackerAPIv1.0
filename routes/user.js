const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.patch('/update/:userId', userController.updateUser);

router.get('/portfolio/:userId', userController.getPortfolio);

router.post('/trade/:userId', userController.addTrade);

router.put('/:userId/update-trade/:assetId/:tradeId', userController.updateTrade);

router.delete('/:userId/delete-trade/:assetId/:tradeId', userController.deleteTrade);

router.delete('/:userId/delete-asset/:assetId', userController.deleteAsset);

router.get('/:userId/get-asset/:assetId', userController.getAssetData);

module.exports = router;