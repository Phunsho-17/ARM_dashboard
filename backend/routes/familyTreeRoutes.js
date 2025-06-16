const express = require('express');
const router = express.Router();
const familyTreeController = require('../controllers/familyTreeController');

router.get('/citizen/:cid', familyTreeController.getCitizen);
router.get('/household/:householdNo', familyTreeController.getHousehold);
router.get('/image/:cid', familyTreeController.getImage);

module.exports = router;