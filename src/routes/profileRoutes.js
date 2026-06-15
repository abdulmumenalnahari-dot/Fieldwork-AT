const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const profileController = require('../controllers/profileController');

router.post('/', upload.single('avatar'), profileController.createOrUpdateProfile);

module.exports = router;