const RendezVous = require('../models/RendezVous');  // Assurez-vous d'importer le modèle de RendezVous
const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require("../models/Notification")
const Devis = require("../models/Devis");

exports.confirmerNouvelleDate = async (req, res) => {
  try {
    const { idrendezvous, confirmation, idclient } = req.body;

    console.log("ID Rendez-vous reçu:", idrendezvous);
    console.log("Confirmation reçue:", confirmation);
    console.log("ID Client reçu:", idclient);

    // Vérification des paramètres
    if (!mongoose.Types.ObjectId.isValid(idrendezvous) || !mongoose.Types.ObjectId.isValid(idclient)) {
      return res.status(400).json({ error: "ID du rendez-vous ou du client invalide." });
    }

    // Vérifier si le client existe
    const clientExistant = await User.findById(idclient);
    if (!clientExistant || clientExistant.status !== 1) {
      return res.status(404).json({ error: "Client non trouvé ou non valide." });
    }

    // Vérifier si le rendez-vous existe
    let rendezVous = await RendezVous.findById(idrendezvous); // Une seule déclaration ici
    if (!rendezVous) {
      return res.status(404).json({ error: "Rendez-vous non trouvé." });
    }

    if (confirmation == 1) {
      // Le client accepte la nouvelle date, donc on valide le rendez-vous avec `datevalide`
      if (rendezVous.propositiondates && rendezVous.propositiondates.length > 0) {
        const updatedRendezVous = await RendezVous.findByIdAndUpdate(
          idrendezvous,
          { 
            datevalide: rendezVous.propositiondates[0].toISOString(),  // On prend la première date de la proposition
            status: 1  // Status de rendez-vous validé
          },
          { new: true }
        );
        console.log("Rendez-vous mis à jour :", updatedRendezVous);
      
        if (!updatedRendezVous) {
          return res.status(404).json({ error: "Rendez-vous non trouvé." });
        }

        // Création de la notification pour le manager
        const manager = await User.findOne({ status: 3 }); // Récupérer l'utilisateur avec le status 'manager'
        if (manager) {
          const notificationManager = new Notification({
            iduser: manager._id,
            type: "Rendez-vous confirmé",
            message: `Le client ${clientExistant.nom} ${clientExistant.prenom} a confirmé la nouvelle date du ${updatedRendezVous.datevalide.toLocaleDateString()} à ${updatedRendezVous.datevalide.toLocaleTimeString()}.`,
            status: false,  // Notification non lue
            date_creation: new Date(),
          });
          // Sauvegarde de la notification pour le manager
          await notificationManager.save();
        } else {
          console.log("Aucun manager trouvé.");
        }

        // Vérifier et récupérer l'ID du client à partir de l'ID de devis
        const devis = await Devis.findById(rendezVous.iddevis);
        if (!devis) {
          return res.status(404).json({ error: "Devis non trouvé." });
        }

        const idclient = devis.idclient;  // L'ID du client est dans le devis
        // Création de la notification pour le client
        const notificationClient = new Notification({
          iduser: idclient,
          type: "Date confirmée",
          message: `Votre nouvelle date de rendez-vous a été confirmée : ${updatedRendezVous.datevalide.toLocaleDateString()} à ${updatedRendezVous.datevalide.toLocaleTimeString()}.`,
          status: false,  // Notification non lue
          date_creation: new Date(),
        });
        // Sauvegarde de la notification pour le client
        await notificationClient.save();
        
        // Sauvegarde de la notification pour le mécanicien
        const notificationMecanicien = new Notification({
          iduser: updatedRendezVous.idmecanicien,
          type: "Rendez-vous confirmé",
          message: `Votre rendez-vous avec le client ${clientExistant.nom} ${clientExistant.prenom} a été confirmé pour le ${updatedRendezVous.datevalide.toLocaleDateString()} à ${updatedRendezVous.datevalide.toLocaleTimeString()}.`,
          status: false,  // Notification non lue
          date_creation: new Date(),
        }); 
        await notificationMecanicien.save();

        res.status(200).json({ message: "Rendez-vous confirmé avec succès", rendezVous: updatedRendezVous });
      } else {
        return res.status(400).json({ error: "Aucune date proposée pour ce rendez-vous." });
      }
    } else if (confirmation == 0) {
      // Le client rejette la proposition de la nouvelle date, on laisse le rendez-vous avec datevalide vide et status 0
      const updatedRendezVous = await RendezVous.findByIdAndUpdate(
        idrendezvous,
        { datevalide: null, status: 0 },  // Réinitialisation de la date 
        { new: true }
      );
      if (!updatedRendezVous) {
        return res.status(404).json({ error: "Rendez-vous non trouvé." });
      }

      // Notification au manager pour l'informer du rejet de la date
      const manager = await User.findOne({ status: 3 }); // Récupérer l'utilisateur avec le status 'manager'
      console.log("Manager trouvé :", manager);
      if (manager) {
        const notificationManager = new Notification({
          iduser: manager._id,
          type: "Proposition rejetée",
          message: `Le client a rejeté la nouvelle date proposée : ${updatedRendezVous.dateproposee ? updatedRendezVous.dateproposee.toLocaleDateString() : "Aucune date"}.`,
          status: false,
          date_creation: new Date(),
        });
        // Sauvegarde de la notification pour le manager
        await notificationManager.save();
      } else {
        console.log("Aucun manager trouvé.");
      }

      res.status(200).json({ message: "Proposition rejetée par le client", rendezVous: updatedRendezVous });
    } else {
      return res.status(400).json({ error: "Réponse de confirmation invalide." });
    }
  } catch (error) {
    console.error("Erreur lors de la confirmation de date :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


exports.proposerNouvelleDate = async (req, res) => {
  try {
    const { idrendezvous, nouvelleDate, idmecanicien, idclient } = req.body;

    console.log("ID Rendez-vous reçu:", idrendezvous);
    console.log("Nouvelle Date reçue:", nouvelleDate);
    console.log("ID Mécanicien reçu:", idmecanicien);
    console.log("ID Client reçu:", idclient);

    // Vérifications des paramètres
    if (!mongoose.Types.ObjectId.isValid(idrendezvous) || !mongoose.Types.ObjectId.isValid(idmecanicien) || !mongoose.Types.ObjectId.isValid(idclient)) {
      return res.status(400).json({ error: "ID du rendez-vous, du mécanicien ou du client invalide." });
    }

    // Vérifier si l'utilisateur (client) existe dans la base de données
    const clientExistant = await User.findById(idclient);
    if (!clientExistant) {
      return res.status(404).json({ error: "Client non trouvé." });
    }

    // Vérifier si le mécanicien existe dans la base de données
    const mecanicienExistant = await User.findById(idmecanicien);
    if (!mecanicienExistant) {
      return res.status(404).json({ error: "Mécanicien non trouvé." });
    }

    // Vérifier si la nouvelle date est valide
    if (!nouvelleDate || isNaN(Date.parse(nouvelleDate))) {
      return res.status(400).json({ error: "Date invalide fournie." });
    }

    const dateObj = new Date(nouvelleDate);
    const heure = dateObj.getUTCHours();




    // Vérification des horaires de travail (8h-12h et 13h-17h)
    if (!((heure >= 8 && heure < 12) || (heure >= 13 && heure < 17))) {
      return res.status(400).json({ error: "L'heure doit être entre 08h-12h ou 13h-17h." });
    }

    // Vérifier si le mécanicien est disponible à cette date et heure
    const rendezVousExistant = await RendezVous.findOne({ datevalide: dateObj, idmecanicien: idmecanicien });
    if (rendezVousExistant) {
      return res.status(400).json({ error: "Le mécanicien n'est pas disponible à cette date et heure." });
    }

    // Mettre à jour le rendez-vous avec la nouvelle date proposée
    const updatedRendezVous = await RendezVous.findByIdAndUpdate(
      idrendezvous,
      { 
        propositiondates: [dateObj],  // Ajouter la nouvelle date à la liste
        status: 2,  // Status de proposition de date
        idmecanicien: idmecanicien
      },
      { new: true }
    );
    
    if (!updatedRendezVous) {
      return res.status(404).json({ error: "Rendez-vous non trouvé." });
    }

    // Création de la notification pour le client
    const nouvelleNotification = new Notification({
      iduser: idclient,  // Utilisation de l'ID client passé en paramètre
      type: "Proposition de rendez-vous",
      message: `Une nouvelle date a été proposée pour votre rendez-vous par cause d'indisponibilité, voici la nouvelle date : ${dateObj.toLocaleDateString()} à ${dateObj.toLocaleTimeString()}. Veuillez confirmer ou refuser, si cela vous convient.`,
      status: false, // Notification non lue
      date_creation: new Date(),
    });

    // Sauvegarde de la notification
    await nouvelleNotification.save();

    res.status(200).json({ message: "Proposition de nouvelle date envoyée avec succès", rendezVous: updatedRendezVous });

  } catch (error) {
    console.error("Erreur lors de la proposition de nouvelle date :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.validerRendezVous = async (req, res) => {
  try {
    const { idrendezvous, dateValide, idmecanicien, idclient } = req.body;
    console.log("ID Rendez-vous reçu:", idrendezvous);
    console.log("ID Mécanicien reçu:", idmecanicien);
    console.log("ID Client reçu:", idclient);


    // Vérifications des paramètres
    if (!mongoose.Types.ObjectId.isValid(idrendezvous) || !mongoose.Types.ObjectId.isValid(idmecanicien) || !mongoose.Types.ObjectId.isValid(idclient)) {
      return res.status(400).json({ error: "ID du rendez-vous, du mécanicien ou du client invalide." });
    }

    // Vérifier si l'utilisateur (client) existe dans la base de données
    const clientExistant = await User.findById(idclient);
    if (!clientExistant) {
      return res.status(404).json({ error: "Client non trouvé." });
    }

    const mecanicienExistant = await User.findById(idmecanicien);
    if (!mecanicienExistant) {
      return res.status(404).json({ error: "Mécanicien non trouvé." });
    }

    if (!dateValide || isNaN(Date.parse(dateValide))) {
      return res.status(400).json({ error: "Date invalide fournie." });
    }

    const dateObj = new Date(dateValide);
    const heure = dateObj.getUTCHours();

    // Vérification des horaires de travail (8h-12h et 13h-17h)
    if (!((heure >= 8 && heure < 12) || (heure >= 13 && heure < 17))) {
      return res.status(400).json({ error: "L'heure doit être entre 08h-12h ou 13h-17h." });
    }

    // Vérifier si le mécanicien est disponible à cette date et heure
    const rendezVousExistant = await RendezVous.findOne({ datevalide: dateObj, idmecanicien: idmecanicien });
    if (rendezVousExistant) {
      return res.status(400).json({ error: "Le mécanicien n'est pas disponible à cette date et heure." });
    }

    // Mettre à jour le rendez-vous avec la date validée et le mécanicien assigné
    const updatedRendezVous = await RendezVous.findByIdAndUpdate(
      idrendezvous,
      { datevalide: dateObj, idmecanicien: idmecanicien },
      { new: true }
    );

    if (!updatedRendezVous) {
      return res.status(404).json({ error: "Rendez-vous non trouvé." });
    }

  // Création de la notification pour le client
  const nouvelleNotification = new Notification({
    iduser: idclient, // Utilisation de l'ID client passé en paramètre
    type: "Rendez-vous validé",
    message: `Votre rendez-vous du ${dateObj.toLocaleDateString()} à ${dateObj.toLocaleTimeString()} a été validé.`,
    status: false, // Notification non lue
    date_creation: new Date(),
  });

  // Sauvegarde de la notification
  await nouvelleNotification.save();

  // Sauvegarde de la notification pour le mecanicien
  const notificationMecanicien = new Notification({
    iduser: idmecanicien, // Utilisation de l'ID mecánicien pasa en paramètre
    type: "Rendez-vous validé",
    message: `Votre rendez-vous avec le client ${clientExistant.nom} ${clientExistant.prenom} a été confirmé pour le ${updatedRendezVous.datevalide.toLocaleDateString()} à ${updatedRendezVous.datevalide.toLocaleTimeString()}.`,
    status: false, // Notification non lue
    date_creation: new Date(),
  });
  await notificationMecanicien.save();

  res.status(200).json({ message: "Rendez-vous validé avec succès et notification envoyée", rendezVous: updatedRendezVous });
  } catch (error) {
    console.error("Erreur lors de la validation du rendez-vous :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getMecaniciensDisponibles = async (req, res) => {
  try {
    const { date } = req.body;

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "Date invalide fournie." });
    }

    const dateObj = new Date(date);
    const heure = dateObj.getUTCHours();

    // Vérification des horaires de travail (8h-12h et 13h-17h)
    if (!((heure >= 8 && heure < 12) || (heure >= 13 && heure < 17))) {
      return res.status(400).json({ error: "L'heure doit être entre 08h-12h ou 13h-17h." });
    }

    // Récupérer les mécaniciens
    const mecaniciens = await User.find({ status: 2 });

    // Récupérer les mécaniciens ayant déjà un rendez-vous à cette date et heure
    const rendezVous = await RendezVous.find({ datevalide: dateObj }).select('idmecanicien');

    const idsMecaniciensOccupes = rendezVous.map(rdv => rdv.idmecanicien.toString());

    // Filtrer les mécaniciens disponibles
    const mecaniciensDisponibles = mecaniciens.filter(mecanicien => 
      !idsMecaniciensOccupes.includes(mecanicien._id.toString())
    );

    res.status(200).json(mecaniciensDisponibles);
  } catch (error) {
    console.error("Erreur lors de la récupération des mécaniciens disponibles :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


// Créer un RendezVous
exports.createRendezVous = async (req, res) => {
  try {
    const { iddevis, propositiondates, infosup } = req.body;

    // Vérification de l'ID du devis
    if (!mongoose.Types.ObjectId.isValid(iddevis)) {
      return res.status(400).json({ error: "ID du devis invalide" });
    }

    // Vérification que propositiondates est un tableau de dates valides
    if (!Array.isArray(propositiondates) || !propositiondates.every(date => !isNaN(Date.parse(date)))) {
      return res.status(400).json({ error: "Les dates proposées doivent être un tableau de dates valides." });
    }

    // Vérification que propositiondates contient exactement 2 dates
    if (propositiondates.length !== 2) {
      return res.status(400).json({ error: "Il faut exactement 2 dates proposées." });
    }

    const currentDate = new Date();
    
    // Vérification que toutes les dates sont dans le futur et respectent les créneaux horaires
    const validTimes = propositiondates.map(dateStr => {
      const date = new Date(dateStr);
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();

      // Vérifie que l'heure est dans les plages 08:00-12:00 ou 13:00-17:00
      const isValidTime = 
        (hours >= 8 && hours < 12) || 
        (hours >= 13 && hours < 17);

      return {
        date,
        isValid: date > currentDate && isValidTime
      };
    });

    // Vérification si toutes les dates sont valides
    if (validTimes.some(({ isValid }) => !isValid)) {
      return res.status(400).json({ error: "Les dates proposées doivent être dans le futur et entre 08h00-12h00 ou 13h00-17h00." });
    }

    const newRendezVous = new RendezVous({
      iddevis,
      propositiondates: validTimes.map(({ date }) => date), // Conversion en ISO
      infosup: infosup || "", // Valeur par défaut si non fournie
      status: 0,
      datevalide: null,
      idmecanicien: null,
    });

    // Sauvegarde en base de données
    const savedRendezVous = await newRendezVous.save();

    // Récupération du devis pour obtenir l'ID du client
    const devis = await Devis.findById(iddevis); // Trouver le devis avec l'ID du devis
    if (!devis) {
      return res.status(404).json({ error: "Devis non trouvé." });
    }

    const idclient = devis.idclient; // Récupérer l'id du client depuis le devis
    const client = await User.findById(idclient);
    if (!client) {
      return res.status(404).json({ error: "Client non trouvé." });
    }

    // Création de la notification pour le client
    const notificationClient = new Notification({
      iduser: idclient,
      type: "Demande de rendez-vous",
      message: `Votre demande de rendez-vous a été reçue. Veuillez patienter pour la confirmation.`,
      status: false,
      date_creation: new Date(),
    });

    // Sauvegarde de la notification pour le client
    await notificationClient.save();
    
    // Récupérer l'utilisateur avec le status 'manager' pour envoyer la notification
    const manager = await User.findOne({ status: 3 }); // Récupérer l'utilisateur avec le status 'manager'
    if (manager) {
      const notificationManager = new Notification({
        iduser: manager._id,
        type: "Nouvelle demande de rendez-vous",
        message: `Une nouvelle demande de rendez-vous a été faite par le client ${client.nom} ${client.prenom}.`,
        status: false,
        date_creation: new Date(),
      });

      // Sauvegarde de la notification pour le manager
      await notificationManager.save();
    } else {
      console.log("Aucun manager trouvé.");
    }

    res.status(201).json({ message: "Rendez-vous créé avec succès et notifications envoyées.", rendezVous: savedRendezVous });
  } catch (error) {
    console.error("Erreur lors de la création du rendez-vous :", error);
    res.status(500).json({ error: "Erreur serveur lors de la création du rendez-vous" });
  }
};


// Récupérer tous les RendezVous
exports.getAllRendezVousNonValides = (req, res) => {
    console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('RendezVous').collection.name);
  RendezVous.find({datevalide: null, idmecanicien: null })
    .then(rendezVous => res.status(200).json(rendezVous))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des devis', err }));
};

exports.getAllRendezVousValides = (req, res) => {
  console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('RendezVous').collection.name);
RendezVous.find({ datevalide: { $ne: null }, idmecanicien: { $ne: null } })
  .then(rendezVous => res.status(200).json(rendezVous))
  .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des devis', err }));
};