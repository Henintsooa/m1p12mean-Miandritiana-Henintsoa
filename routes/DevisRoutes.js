const express = require('express');
const router = express.Router();
const devisController = require('../controllers/devisController');

router.get('/', devisController.getAllDevis);
router.post('/', devisController.createDevis);
router.get('/:idclient', devisController.getAllDevisByUser);
module.exports = router;