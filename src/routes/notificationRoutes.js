const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.post('/push', notificationController.sendPushNotification);

router.post('/remind-carts', notificationController.remindAbandonedCarts);

module.exports = router;