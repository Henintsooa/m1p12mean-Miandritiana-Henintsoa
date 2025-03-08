const Devis = require('../models/Devis');  // Assurez-vous d'importer le modèle de Devis
const mongoose = require('mongoose');

// Créer un devis
exports.createDevis = (req, res) => {
  const { immatriculation, idtypemoteur, idmodele, idclient, idprestations } = req.body;

  const newDevis = new Devis({
    immatriculation,
    idtypemoteur,
    idmodele,
    idclient,
    idprestations,
  });

  newDevis.save()
    .then(devis => res.status(201).json({ message: 'Devis créé avec succès', devis }))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la création du devis', err }));
};

// Récupérer tous les devis avec prestations
exports.getAllDevis = (req, res) => {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Devis').collection.name);
  Devis.find()
    .then(devis => res.status(200).json(devis))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des devis', err }));
};

// Récupérer un devis par ID avec prestations
exports.getAllDevisByUser = (req, res) => {
  const { idclient } = req.params; // Récupérer l'ID utilisateur depuis l'URL

  // Vérifier si l'ID est valide
  if (!mongoose.Types.ObjectId.isValid(idclient)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
  }

  Devis.find({ idclient: new mongoose.Types.ObjectId(idclient) }) // Filtrer par idclient
      .populate({ path: 'idtypemoteur', model: 'typeMoteur' }) // Jointure TypeMoteur
      .populate({ path: 'idmodele', model: 'Modele' }) // Jointure Modele
      .populate({ 
          path: 'idprestations', 
          model: 'Prestation',
          populate: { path: 'idcategorieprestation', model: 'CategoriePrestation' } // Jointure Catégorie
      }) // Jointure Prestations avec catégorie
      .then(devis => {
          if (devis.length === 0) {
              return res.status(404).json({ message: "Aucun devis trouvé pour cet utilisateur." });
          }
           // Transformation du format pour le front-end Angular
           const result = devis.map(devisItem => {
            return {
                _id: devisItem._id,
                immatriculation: devisItem.immatriculation,
                typemoteur: devisItem.idtypemoteur.nom,  // Nom du type moteur
                modele: devisItem.idmodele.nom,  // Nom du modèle
                idclient: devisItem.idclient,
                prestations: devisItem.idprestations.map(prestation => ({
                    _id: prestation._id,
                    nom: prestation.nom,
                    typemoteur: prestation.idtypemoteur.nom,  // Nom du type moteur pour la prestation
                    modele: prestation.idmodele.nom,  // Nom du modèle pour la prestation
                    categorieprestation: prestation.idcategorieprestation.nom,  // Nom de la catégorie de prestation
                    prixunitaire: prestation.prixunitaire
                }))
            };
        });

        res.status(200).json(result);
      })
      .catch(err => {
          console.error('Erreur lors de la récupération des devis', err);
          res.status(500).json({ error: 'Erreur lors de la récupération des devis', err });
      });
};

// Mettre à jour un devis
exports.updateDevis = (req, res) => {
  const { id } = req.params;
  const { immatriculation, idtypemoteur, idmodele, idclient, idprestations } = req.body;

  Devis.findByIdAndUpdate(id, {
    immatriculation,
    idtypemoteur,
    idmodele,
    idclient,
    idprestations,
  }, { new: true })
    .then(devis => {
      if (!devis) {
        return res.status(404).json({ message: 'Devis non trouvé pour mise à jour' });
      }
      res.status(200).json({ message: 'Devis mis à jour avec succès', devis });
    })
    .catch(err => res.status(500).json({ error: 'Erreur lors de la mise à jour du devis', err }));
};

// Supprimer un devis
exports.deleteDevis = (req, res) => {
  const { id } = req.params;

  Devis.findByIdAndDelete(id)
    .then(devis => {
      if (!devis) {
        return res.status(404).json({ message: 'Devis non trouvé pour suppression' });
      }
      res.status(200).json({ message: 'Devis supprimé avec succès' });
    })
    .catch(err => res.status(500).json({ error: 'Erreur lors de la suppression du devis', err }));
};
