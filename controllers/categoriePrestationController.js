const CategoriePrestation = require('../models/CategoriePrestation');  // Assurez-vous d'importer le modèle de CategoriePrestation
const mongoose = require('mongoose');

// Créer un CategoriePrestation

// Récupérer tous les CategoriePrestation
exports.getAllCategoriePrestation = (req, res) => {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('CategoriePrestation').collection.name);
  CategoriePrestation.find()
    .then(categoriePrestation => res.status(200).json(categoriePrestation))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des devis', err }));
};
