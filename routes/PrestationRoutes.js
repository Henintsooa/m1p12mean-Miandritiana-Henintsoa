const express = require('express');
const router = express.Router();
const PrestationController = require('../controllers/prestationController');
const CategoriePrestationController = require('../controllers/categoriePrestationController');

router.get('/:idcategorieprestation', PrestationController.getPrestationByCategorie);
router.get('/:idtypemoteur/:idmodele', PrestationController.getPrestationByMoteurEtModele);
router.get('/', PrestationController.getAllPrestation);
module.exports = router;
