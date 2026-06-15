const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');
router.post('/upgrade-vip', loyaltyController.upgradeToVIP);

module.exports = router;