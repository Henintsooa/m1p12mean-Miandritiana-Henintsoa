const express = require('express');
const router = express.Router();
const CategoriePrestationController = require('../controllers/categoriePrestationController');


router.get('/', CategoriePrestationController.getAllCategoriePrestation);
router.post('/', CategoriePrestationController.createCategoriePrestation);
module.exports = router;
