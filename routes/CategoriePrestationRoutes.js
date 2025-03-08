const express = require('express');
const router = express.Router();
const CategoriePrestationController = require('../controllers/categoriePrestationController');


router.get('/', CategoriePrestationController.getAllCategoriePrestation);
module.exports = router;
