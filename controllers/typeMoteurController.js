const TypeMoteur = require('../models/typeMoteur');  // Assurez-vous d'importer le modèle de TypeMoteur
const mongoose = require('mongoose');

// Créer 
exports.createTypeMoteur = (req, res) => {
  const { nom } = req.body;

  const newTypeMoteur = new TypeMoteur({
    nom,
  });

  newTypeMoteur.save()
    .then(typeMoteur => res.status(201).json({ message: 'Type Moteur créé avec succès', typeMoteur }))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la création du type moteur', err }));
};

exports.getTypeMoteur = (req, res) => {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('typeMoteur').collection.name);
  TypeMoteur.find()
    .then(typeMoteur => res.status(200).json(typeMoteur))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des type moteur', err }));
};
