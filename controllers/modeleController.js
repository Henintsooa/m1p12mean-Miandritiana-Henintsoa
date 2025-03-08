const Modele = require('../models/Modele');  // Assurez-vous d'importer le modèle de TypeMoteur
const mongoose = require('mongoose');

// Créer 
exports.createModele = (req, res) => {
  const { nom } = req.body;

  const newModele = new Modele({
    nom,
  });

  newModele.save()
    .then(Modele => res.status(201).json({ message: 'Type Moteur créé avec succès', Modele }))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la création du type moteur', err }));
};

exports.getModele = (req, res) => {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Modele').collection.name);
  Modele.find()
    .then(Modele => res.status(200).json(Modele))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des type moteur', err }));
};
