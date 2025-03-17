const CategoriePrestation = require('../models/CategoriePrestation');  // Assurez-vous d'importer le modèle de CategoriePrestation
const mongoose = require('mongoose');

// Créer un CategoriePrestation
exports.createCategoriePrestation = async (req, res) => {
  CategoriePrestation.create(req.body)
    .then(categoriePrestation => res.status(201).json({ message: 'CategoriePrestation créé avec succès', categoriePrestation })) // En cas de succès
    .catch(err => res.status(400).json({ error: 'Erreur lors de la création du CategoriePrestation', err })); // En cas d'erreur
    console.log("Categorie Prestation créée avec succès");
}
// Récupérer tous les CategoriePrestation
exports.getAllCategoriePrestation = (req, res) => {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('CategoriePrestation').collection.name);
  CategoriePrestation.find()
    .then(categoriePrestation => res.status(200).json(categoriePrestation))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des devis', err }));
};
