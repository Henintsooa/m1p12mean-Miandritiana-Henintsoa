const express = require('express');
const router = express.Router();
const devisController = require('../controllers/devisController');

router.get('/', devisController.getAllDevis);
router.post('/', devisController.createDevis);
router.get('/:idclient', devisController.getAllAcceptedDevisByUser);
router.get('/dernier/:idclient', devisController.getLastDevisByUser);
router.post('/accepter/:iddevis', devisController.acceptDevis);

module.exports = router;