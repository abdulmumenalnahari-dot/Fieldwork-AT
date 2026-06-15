const express = require('express');
const router = express.Router();

const pdfController = require('../controllers/pdfController');

router.get('/generate/:tracking_number', pdfController.generateInvoice);


module.exports = router;