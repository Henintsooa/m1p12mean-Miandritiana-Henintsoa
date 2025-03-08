const express = require('express');
const router = express.Router();
const typeMoteurController = require('../controllers/typeMoteurController');

router.get('/', typeMoteurController.getTypeMoteur);

module.exports = router;