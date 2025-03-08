const express = require('express');
const router = express.Router();
const ModeleController = require('../controllers/modeleController');

router.get('/', ModeleController.getModele);

module.exports = router;