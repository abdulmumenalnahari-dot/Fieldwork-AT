const express = require('express');
const router = express.Router();

const paymentController = require('../controllers/paymentController');

router.post('/card', paymentController.processCardPayment);

router.post('/refund', paymentController.refundOrder);

module.exports = router;