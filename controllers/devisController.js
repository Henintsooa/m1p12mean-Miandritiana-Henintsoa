const Devis = require('../models/Devis');  // Assurez-vous d'importer le modèle de Devis
const mongoose = require('mongoose');

// Créer un devis
const Prestation = require("../models/Prestation"); // Assure-toi d'importer le modèle Prestation

exports.createDevis = async (req, res) => {
  try {
    const { immatriculation, idtypemoteur, idmodele, idclient, idprestations } = req.body;

    // Vérifier si idprestations est un tableau et non vide
    if (!Array.isArray(idprestations) || idprestations.length === 0) {
      return res.status(400).json({ error: "Aucune prestation fournie" });
    }

    // Récupérer les prestations avec leurs prix
    const prestationsData = await Prestation.find({ _id: { $in: idprestations } });

    // Vérifier si des prestations existent
    if (!prestationsData.length) {
      return res.status(400).json({ error: "Aucune prestation trouvée" });
    }

    // Construire le tableau des prestations avec avancement par défaut
    const prestations = prestationsData.map(prestation => ({
      idprestation: prestation._id,
      avancement: 1 // Valeur par défaut
    }));

    // Calculer le prix total
    const prixtotal = prestationsData.reduce((total, prestation) => total + prestation.prixunitaire, 0);

    // Créer le devis avec le prix total et les prestations correctement formatées
    const newDevis = new Devis({
      immatriculation,
      idtypemoteur,
      idmodele,
      idclient,
      prestations, // Utilisation du tableau formaté avec avancement
      prixtotal
    });

    // Sauvegarde en base de données
    const savedDevis = await newDevis.save();
    
    res.status(201).json({ message: "Devis créé avec succès", devis: savedDevis });

  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la création du devis", details: err.message });
  }
};



exports.acceptDevis = (req, res) => {
  const { iddevis } = req.params; // Récupérer l'ID du devis depuis l'URL

  // Vérifier si l'ID est valide
  if (!mongoose.Types.ObjectId.isValid(iddevis)) {
    return res.status(400).json({ error: 'ID devis invalide' });
  }

  // Mettre à jour le devis pour accepter
  Devis.findByIdAndUpdate(
    iddevis,
    { accepte: true }, // Mettre "accepte" à true
    { new: true } // Retourner le document mis à jour
  )
    .then(updatedDevis => {
      if (!updatedDevis) {
        return res.status(404).json({ message: "Devis non trouvé." });
      }
      res.status(200).json({ message: "Devis accepté avec succès.", devis: updatedDevis });
    })
    .catch(err => {
      console.error("Erreur lors de l'acceptation du devis", err);
      res.status(500).json({ error: "Erreur lors de l'acceptation du devis", err });
    });
};

exports.getLastDevisByUser = (req, res) => {
  const { idclient } = req.params;

  if (!mongoose.Types.ObjectId.isValid(idclient)) {
    return res.status(400).json({ error: 'ID utilisateur invalide' });
  }

  Devis.find({ idclient: new mongoose.Types.ObjectId(idclient) })
    .sort({ createdAt: -1 })
    .populate({ path: 'idtypemoteur', model: 'typeMoteur' })
    .populate({ path: 'idmodele', model: 'Modele' })
    .populate({ 
      path: 'prestations.idprestation',
      model: 'Prestation',
      populate: { path: 'idcategorieprestation', model: 'CategoriePrestation' }
    })
    .then(devis => {
      if (devis.length === 0) {
        return res.status(404).json({ message: "Aucun devis trouvé pour cet utilisateur." });
      }

      const result = devis.map(devisItem => {
        const prixtotal = devisItem.prestations.reduce((sum, p) => sum + (p.idprestation ? p.idprestation.prixunitaire : 0), 0);

        return {
          iddevis: devisItem._id,
          immatriculation: devisItem.immatriculation,
          typemoteur: devisItem.idtypemoteur.nom,
          modele: devisItem.idmodele.nom,
          idclient: devisItem.idclient,
          prixtotal,
          accepte: devisItem.accepte,
          prestations: devisItem.prestations.map(p => ({
            idprestation: p.idprestation._id,
            nom: p.idprestation.nom,
            categorieprestation: p.idprestation.idcategorieprestation.nom,
            prixunitaire: p.idprestation.prixunitaire,
            avancement: p.avancement
          })),
          createdAt: devisItem.createdAt
        };
      });

      res.status(200).json({ dernierDevis: result[0] });
    })
    .catch(err => {
      console.error('Erreur lors de la récupération des devis', err);
      res.status(500).json({ error: 'Erreur lors de la récupération des devis', err });
    });
};

// Récupérer tous les devis avec prestations
exports.getAllDevis = (req, res) => {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Devis').collection.name);
  Devis.find()
    .then(devis => res.status(200).json(devis))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des devis', err }));
};

// Récupérer un devis par ID avec prestations
exports.getAllAcceptedDevisByUser = (req, res) => {
  const { idclient } = req.params;

  if (!mongoose.Types.ObjectId.isValid(idclient)) {
    return res.status(400).json({ error: 'ID utilisateur invalide' });
  }

  Devis.find({ idclient: new mongoose.Types.ObjectId(idclient), accepte: true })
    .populate({ path: 'idtypemoteur', model: 'typeMoteur' })
    .populate({ path: 'idmodele', model: 'Modele' })
    .populate({ 
      path: 'prestations.idprestation',
      model: 'Prestation',
      populate: { path: 'idcategorieprestation', model: 'CategoriePrestation' }
    })
    .then(devis => {
      if (devis.length === 0) {
        return res.status(404).json({ message: "Aucun devis accepté trouvé pour cet utilisateur." });
      }

      const result = devis.map(devisItem => {
        const prixtotal = devisItem.prestations.reduce((sum, p) => sum + (p.idprestation ? p.idprestation.prixunitaire : 0), 0);

        return {
          iddevis: devisItem._id,
          immatriculation: devisItem.immatriculation,
          typemoteur: devisItem.idtypemoteur.nom,
          modele: devisItem.idmodele.nom,
          idclient: devisItem.idclient,
          prixtotal,
          accepte: devisItem.accepte,
          prestations: devisItem.prestations.map(p => ({
            idprestation: p.idprestation._id,
            nom: p.idprestation.nom,
            categorieprestation: p.idprestation.idcategorieprestation.nom,
            prixunitaire: p.idprestation.prixunitaire,
            avancement: p.avancement
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
