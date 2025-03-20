const express = require('express');
const router = express.Router();
const PrestationController = require('../controllers/prestationController');
const CategoriePrestationController = require('../controllers/categoriePrestationController');

router.delete('/:id', PrestationController.deletePrestation);
router.put('/:id', PrestationController.updatePrestation);
router.get('/:idcategorieprestation', PrestationController.getPrestationByCategorie);
router.get('/:idtypemoteur/:idmodele', PrestationController.getPrestationByMoteurEtModele);
router.post('/', PrestationController.createPrestation);
router.get('/', PrestationController.getAllPrestation);
module.exports = router;
