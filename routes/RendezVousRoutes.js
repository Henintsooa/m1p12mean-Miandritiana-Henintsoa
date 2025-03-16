const express = require('express');
const router = express.Router();
const RendezVousController = require('../controllers/rendezVousController');

router.post('/valider', RendezVousController.validerRendezVous);
router.get('/mecaniciens', RendezVousController.getMecaniciensDisponibles);
router.post('/', RendezVousController.createRendezVous);
router.get('/acceptes', RendezVousController.getAllRendezVousValides);
router.get('/nonvalides', RendezVousController.getAllRendezVousNonValides);
module.exports = router;
