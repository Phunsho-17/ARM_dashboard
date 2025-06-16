const express = require('express');
const router = express.Router();
const citizenController = require('../controllers/citizenController');

router.get('/citizens', citizenController.getCitizens);
router.get('/dzongkhags', citizenController.getDzongkhags);
router.get('/gewogs', citizenController.getGewogs);

module.exports = router;
