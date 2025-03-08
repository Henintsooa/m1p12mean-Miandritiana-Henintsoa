const Prestation = require('../models/Prestation');
const mongoose = require('mongoose');

exports.getAllPrestation = (req, res) => {
  console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Prestation').collection.name);

  Prestation.find()
    .populate({ path: 'idtypemoteur', model: 'typeMoteur' })  // Récupère les données du TypeMoteur
    .populate({ path: 'idmodele', model: 'Modele' })  // Récupère les données du Modele
    .populate({ path: 'idcategorieprestation', model: 'CategoriePrestation' })  // Récupère les données de CategoriePrestation
    .then(prestations => {
      // Réponse avec les prestations et toutes les données des références
      res.status(200).json(prestations);
    })
    .catch(err => {
      console.error('Erreur lors de la récupération des prestations', err);
      res.status(500).json({ error: 'Erreur lors de la récupération des prestations', err });
    });
};

exports.getPrestationByMoteurEtModele = (req, res) => {
  const { idtypemoteur, idmodele } = req.params; // Récupère les IDs depuis l'URL

  // Vérifier si les IDs sont valides
  if (!mongoose.Types.ObjectId.isValid(idtypemoteur) || !mongoose.Types.ObjectId.isValid(idmodele)) {
    return res.status(400).json({ error: 'ID de moteur ou de modèle invalide' });
  }

  Prestation.find({ 
      idtypemoteur: new mongoose.Types.ObjectId(idtypemoteur), 
      idmodele: new mongoose.Types.ObjectId(idmodele) 
  })
    .populate({ path: 'idtypemoteur', model: 'typeMoteur' })  
    .populate({ path: 'idmodele', model: 'Modele' })  
    .populate({ path: 'idcategorieprestation', model: 'CategoriePrestation' })  
    .then(prestations => {
      if (prestations.length === 0) {
        return res.status(404).json({ message: "Aucune prestation trouvée pour ce moteur et ce modèle." });
      }
      const result = prestations.map(prestation => {
        return {
          _id: prestation._id,
          nom: prestation.nom,
          typemoteur: prestation.idtypemoteur.nom,  // Nom du type moteur
          modele: prestation.idmodele.nom,  // Nom du modèle
          categorieprestation: prestation.idcategorieprestation.nom,  // Nom de la catégorie de prestation
          prixunitaire: prestation.prixunitaire
        };
      });

      res.status(200).json(result);
    })
    .catch(err => {
      console.error('Erreur lors de la récupération des prestations', err);
      res.status(500).json({ error: 'Erreur lors de la récupération des prestations', err });
    });
};


exports.getPrestationByCategorie = (req, res) => {
  const { idcategorieprestation } = req.params; // Récupère l'ID depuis l'URL

  // Vérifier si l'ID est un ObjectId valide
  if (!mongoose.Types.ObjectId.isValid(idcategorieprestation)) {
    return res.status(400).json({ error: 'ID de catégorie invalide' });
  }

  Prestation.find({ idcategorieprestation: new mongoose.Types.ObjectId(idcategorieprestation) }) // Filtrer par catégorie
    .populate({ path: 'idtypemoteur', model: 'typeMoteur' })  
    .populate({ path: 'idmodele', model: 'Modele' })  
    .populate({ path: 'idcategorieprestation', model: 'CategoriePrestation' })  
    .then(prestations => {
      if (prestations.length === 0) {
        return res.status(404).json({ message: "Aucune prestation trouvée pour cette catégorie." });
      }
      res.status(200).json(prestations);
    })
    .catch(err => {
      console.error('Erreur lors de la récupération des prestations', err);
      res.status(500).json({ error: 'Erreur lors de la récupération des prestations', err });
    });
};

// Créer un Prestation
exports.createPrestation = (req, res) => {
  const { nom, idtypemoteur, idmodele, idcategorieprestation, prixunitaire } = req.body;

  const newPrestation = new Prestation({
    nom,
    idtypemoteur,
    idmodele,
    idcategorieprestation,
    prixunitaire,
  });

  newPrestation.save()
    .then(prestation => res.status(201).json({ message: 'prestation créée avec succès', prestation }))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la création du prestation', err }));
};

// Mettre à jour 
exports.updatePrestation = (req, res) => {
  const { id } = req.params;
  const { nom, idtypemoteur, idmodele, idcategorieprestation, prixunitaire } = req.body;

  Prestation.findByIdAndUpdate(id, {
    nom,
    idtypemoteur,
    idmodele,
    idcategorieprestation,
    prixunitaire,
  }, { new: true })
    .then(prestation => {
      if (!prestation) {
        return res.status(404).json({ message: 'Prestation non trouvé pour mise à jour' });
      }
      res.status(200).json({ message: 'Prestation mis à jour avec succès', prestation });
    })
    .catch(err => res.status(500).json({ error: 'Erreur lors de la mise à jour du prestation', err }));
};

// Supprimer un prestation
exports.deletePrestation = (req, res) => {
  const { id } = req.params;

  Prestation.findByIdAndDelete(id)
    .then(prestation => {
      if (!prestation) {
        return res.status(404).json({ message: 'prestation non trouvé pour suppression' });
      }
      res.status(200).json({ message: 'prestation supprimé avec succès' });
    })
    .catch(err => res.status(500).json({ error: 'Erreur lors de la suppression du prestation', err }));
};
