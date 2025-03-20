const Prestation = require('../models/Prestation');
const mongoose = require('mongoose');

exports.getAllPrestation = async (req, res) => {
  try {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Prestation').collection.name);

    const prestations = await Prestation.find({ archive: false })
      .populate({ path: 'idtypemoteur', model: 'typeMoteur' })
      .populate({ path: 'idmodele', model: 'Modele' })
      .populate({ path: 'idcategorieprestation', model: 'CategoriePrestation' })
      .lean();

    res.status(200).json(prestations);
  } catch (err) {
    console.error('Erreur lors de la récupération des prestations', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des prestations' });
  }
};

exports.getPrestationByMoteurEtModele = async (req, res) => {
  try {
    const { idtypemoteur, idmodele } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idtypemoteur) || !mongoose.Types.ObjectId.isValid(idmodele)) {
      return res.status(400).json({ error: 'ID de moteur ou de modèle invalide' });
    }

    const prestations = await Prestation.find({
      archive: false,
      idtypemoteur: idtypemoteur,
      idmodele: idmodele
    })
      .populate({ path: 'idtypemoteur', model: 'typeMoteur' })
      .populate({ path: 'idmodele', model: 'Modele' })
      .populate({ path: 'idcategorieprestation', model: 'CategoriePrestation' })
      .lean();

    if (prestations.length === 0) {
      return res.status(404).json({ message: "Aucune prestation trouvée pour ce moteur et ce modèle." });
    }

    const result = prestations.map(prestation => ({
      _id: prestation._id,
      nom: prestation.nom,
      typemoteur: prestation.idtypemoteur?.nom || 'Non défini',
      modele: prestation.idmodele?.nom || 'Non défini',
      categorieprestation: prestation.idcategorieprestation?.nom || 'Non défini',
      prixunitaire: prestation.prixunitaire
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Erreur lors de la récupération des prestations', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des prestations' });
  }
};

exports.getPrestationByCategorie = async (req, res) => {
  try {
    const { idcategorieprestation } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idcategorieprestation)) {
      return res.status(400).json({ error: 'ID de catégorie invalide' });
    }
    console.log("idcategorieprestation", idcategorieprestation);
    const prestations = await Prestation.find({ archive: false, idcategorieprestation })
      .populate({ path: 'idtypemoteur', model: 'typeMoteur' })
      .populate({ path: 'idmodele', model: 'Modele' })
      .populate({ path: 'idcategorieprestation', model: 'CategoriePrestation' })
      .lean();
    console.log("prestations", prestations);
    if (prestations.length === 0) {
      return res.status(404).json({ message: "Aucune prestation trouvée pour cette catégorie." });
    }

    res.status(200).json(prestations);
  } catch (err) {
    console.error('Erreur lors de la récupération des prestations', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des prestations' });
  }
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
    archive: false
  });

  newPrestation.save()
    .then(prestation => res.status(201).json({ message: 'prestation créée avec succès', prestation }))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la création du prestation', err }));
};

// Mettre à jour 
exports.updatePrestation = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, idtypemoteur, idmodele, idcategorieprestation, prixunitaire } = req.body;

    // Vérifier si la prestation existe
    const prestation = await Prestation.findById(id);
    if (!prestation) {
      return res.status(404).json({ message: 'Prestation non trouvée pour mise à jour' });
    }

    // Archiver l'ancienne prestation
    prestation.archive = true;
    await prestation.save();

    // Créer une nouvelle prestation avec les nouvelles valeurs
    const newPrestation = await Prestation.create({
      nom,
      idtypemoteur,
      idmodele,
      idcategorieprestation,
      prixunitaire,
      archive: false
    });

    res.status(200).json({ message: 'Prestation mise à jour avec succès', newPrestation });

  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la prestation', err });
  }
};


// Supprimer un prestation
exports.deletePrestation = async (req, res) => {
  try {
    const { id } = req.params;

    const prestation = await Prestation.findById(id);
    if (!prestation) {
      return res.status(404).json({ message: 'Prestation non trouvée pour suppression' });
    }

    // Marquer comme archivée
    prestation.archive = true;
    await prestation.save();

    res.status(200).json({ message: 'Prestation archivée avec succès' });

  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l’archivage de la prestation', err });
  }
};
