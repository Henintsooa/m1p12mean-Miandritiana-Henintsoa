const RendezVous = require('../models/RendezVous');  // Assurez-vous d'importer le modèle de RendezVous
const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require("../models/Notification")
const Devis = require("../models/Devis");
const Prestation = require('../models/Prestation'); 

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
            status: 1,  // Status de rendez-vous validé
            avancement: 1  // Avancement de 1 pour indiquer en attente chez le mécanicien
          },
          { new: true }
        );
        console.log("Rendez-vous mis à jour :", updatedRendezVous);
      
        if (!updatedRendezVous) {
          return res.status(404).json({ error: "Rendez-vous non trouvé." });
        }

        // Création de la notification pour le manager
        const managers = await User.find({ status: 3 }); // Récupérer tous les utilisateurs avec le status 'manager'
        if (managers && managers.length > 0) {
          for (const manager of managers) {
            const notificationManager = new Notification({
              iduser: manager._id,
              type: "Rendez-vous confirmé",
              message: `Le client ${clientExistant.nom} ${clientExistant.prenom} a confirmé la nouvelle date du ${updatedRendezVous.datevalide.toLocaleDateString('fr-FR')} à ${updatedRendezVous.datevalide.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
              status: false,  // Notification non lue
              date_creation: new Date(),
            });
            // Sauvegarde de la notification pour chaque manager
            await notificationManager.save();
          }
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
          message: `Votre nouvelle date de rendez-vous a été confirmée : ${updatedRendezVous.datevalide.toLocaleDateString('fr-FR')} à ${updatedRendezVous.datevalide.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
          status: false,  // Notification non lue
          date_creation: new Date(),
        });
        // Sauvegarde de la notification pour le client
        await notificationClient.save();
        
        // Sauvegarde de la notification pour le mécanicien
        const notificationMecanicien = new Notification({
          iduser: updatedRendezVous.idmecanicien,
          type: "Rendez-vous confirmé",
          message: `Votre rendez-vous avec le client ${clientExistant.nom} ${clientExistant.prenom} a été confirmé pour le ${updatedRendezVous.datevalide.toLocaleDateString('fr-FR')} à ${updatedRendezVous.datevalide.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
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

      // Notifications aux managers pour les informer du rejet de la date
      const managers = await User.find({ status: 3 }); // Récupérer tous les utilisateurs avec le status 'manager'
      if (managers && managers.length > 0) {
        for (const manager of managers) {
          const notificationManager = new Notification({
        iduser: manager._id,
        type: "Proposition rejetée",
        message: `Le client a rejeté la nouvelle date proposée : ${updatedRendezVous.dateproposee ? updatedRendezVous.dateproposee.toLocaleDateString('fr-FR') : "Aucune date"}.`,
        status: false,
        date_creation: new Date(),
          });
          // Sauvegarde de la notification pour chaque manager
          await notificationManager.save();
        }
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

exports.getRendezVousAConfirmer = async (req, res) => {
  try {
    const rendezVousAConfirmer = await RendezVous.find({ status: 2,
      idmecanicien: { $ne: null }
      })
      .populate('idmecanicien', 'nom prenom')
      .sort({ createdAt: -1 });

    const resultats = [];

    for (const rdv of rendezVousAConfirmer) {
      const devis = await Devis.findById(rdv.iddevis);

      if (!devis) continue;

      const prestationsDetail = [];

      for (const p of devis.prestations) {
        const prestation = await Prestation.findById(p.idprestation);
        if (prestation) {
          prestationsDetail.push(prestation.nom);
        }
      }

      resultats.push({
        idrendezvous: rdv._id,
        mecanicien: rdv.idmecanicien ? `${rdv.idmecanicien.nom} ${rdv.idmecanicien.prenom}` : null,
        propositiondate: rdv.propositiondates?.[0] ?? null,
        prestations: prestationsDetail,
      });
    }

    res.status(200).json(resultats);

  } catch (error) {
    console.error("Erreur lors de la récupération des rendez-vous à confirmer :", error);
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

    // Récupère l'heure locale (au lieu d'UTC)
    const heure = dateObj.getHours(); // getHours() retourne l'heure locale

    // Vérification des horaires de travail (8h-12h et 13h-17h) en fonction de l'heure locale
    if (!((heure >= 8 && heure < 12) || (heure >= 13 && heure < 17))) {
      return res.status(400).json({ error: "L'heure doit être entre 08h-12h ou 13h-17h." });
    }

    // Vérifier si le mécanicien est disponible à cette date et heure (en local)
    const rendezVousExistant = await RendezVous.findOne({
      datevalide: dateObj, 
      idmecanicien: idmecanicien
    });
    if (rendezVousExistant) {
      return res.status(400).json({ error: "Le mécanicien n'est pas disponible à cette date et heure." });
    }

    // Mettre à jour le rendez-vous avec la nouvelle date proposée (en local)
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

    // Création de la notification pour le client (en tenant compte du fuseau horaire local)
    const nouvelleNotification = new Notification({
      iduser: idclient,  // Utilisation de l'ID client passé en paramètre
      type: "Proposition de rendez-vous",
      message: `Une nouvelle date a été proposée pour votre rendez-vous par cause d'indisponibilité, voici la nouvelle date : ${dateObj.toLocaleDateString('fr-FR')} à ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Veuillez confirmer ou refuser, si cela vous convient.`,
      status: false, // Notification non lue
      date_creation: new Date(),
    });

    // Sauvegarde de la notification
    await nouvelleNotification.save();

    // Réponse avec succès
    res.status(200).json({ message: "Proposition de nouvelle date envoyée avec succès", rendezVous: updatedRendezVous });


  } catch (error) {
    console.error("Erreur lors de la proposition de nouvelle date :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.validerRendezVous = async (req, res) => {
  try {
    const { idrendezvous, datevalide, idmecanicien, idclient } = req.body;
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

    if (!datevalide || isNaN(Date.parse(datevalide))) {
      return res.status(400).json({ error: "Date invalide fournie." });
    }

    const dateObj = new Date(datevalide);

    // Récupère l'heure locale
    const heure = dateObj.getHours();

    // Vérification des horaires de travail (8h-12h et 13h-17h) en fonction de l'heure locale
    if (!((heure >= 8 && heure < 12) || (heure >= 13 && heure < 17))) {
      return res.status(400).json({ error: "L'heure doit être entre 08h-12h ou 13h-17h." });
    }

    // Vérifier si le mécanicien est disponible à cette date et heure (en local)
    const rendezVousExistant = await RendezVous.findOne({
      datevalide: dateObj, 
      idmecanicien: idmecanicien
    });
    if (rendezVousExistant) {
      return res.status(400).json({ error: "Le mécanicien n'est pas disponible à cette date et heure." });
    }

    // Mettre à jour le rendez-vous avec la date validée et le mécanicien assigné
    const updatedRendezVous = await RendezVous.findByIdAndUpdate(
      idrendezvous,
      { 
        datevalide: dateObj, 
        idmecanicien: idmecanicien, 
        status: 1, // Status de rendez-vous validé
        avancement: 1 // Avancement en attente chez le mécanicien
      },
      { new: true }
    );

    if (!updatedRendezVous) {
      return res.status(404).json({ error: "Rendez-vous non trouvé." });
    }

    // Création de la notification pour le client (en tenant compte du fuseau horaire local)
    const nouvelleNotification = new Notification({
      // ID client
      type: "Rendez-vous validé",
      message: `Votre rendez-vous du ${dateObj.toLocaleDateString('fr-FR')} à ${dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} a été validé.`,
      status: false, // Notification non lue
      date_creation: new Date(),
    });

    // Sauvegarde de la notification pour le client
    await nouvelleNotification.save();

    // Création de la notification pour le mécanicien
    const notificationMecanicien = new Notification({
      iduser: idmecanicien, // ID mécanicien
      type: "Rendez-vous validé",
      message: `Votre rendez-vous avec le client ${clientExistant.nom} ${clientExistant.prenom} a été confirmé pour le ${updatedRendezVous.datevalide.toLocaleDateString('fr-FR')} à ${updatedRendezVous.datevalide.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
      status: false, // Notification non lue
      date_creation: new Date(),
    });

    // Sauvegarde de la notification pour le mécanicien
    await notificationMecanicien.save();

    // Réponse avec succès
    res.status(200).json({ message: "Rendez-vous validé avec succès et notification envoyée", rendezVous: updatedRendezVous });

  } catch (error) {
    console.error("Erreur lors de la validation du rendez-vous :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getMecaniciensDisponibles = async (req, res) => {
  try {
    let { date } = req.params;

    if (!date || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: "Date invalide fournie." });
    }
     // Vérifier si la date est au format YYYY-MM-DDTHH:MM (sans secondes)
     const regexSansSecondes = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    
     if (regexSansSecondes.test(date)) {
       date += ":00"; // Ajouter les secondes si absentes
     }
 
     // Ajouter le 'Z' à la fin si ce n'est pas un format UTC valide
     if (!date.endsWith("Z") && !date.includes("+")) {
       date += "Z"; // Convertir en UTC
     }
 
    const dateObj = new Date(date);
    const heure = dateObj.getUTCHours();

    // Vérification des horaires de travail (8h-12h et 13h-17h)
    if (!((heure >= 8 && heure < 12) || (heure >= 13 && heure < 17))) {
      return res.status(400).json({ error: "L'heure doit être entre 08h-12h ou 13h-17h." });
    }

    // Récupérer tous les mécaniciens
    const mecaniciens = await User.find({ status: 2 }).select('-mdp');

    // Définir la plage horaire du jour (8h-12h et 13h-17h)
    const dateDebutMatin = new Date(dateObj.setHours(8, 0, 0, 0)); // 08:00
    const dateFinMatin = new Date(dateObj.setHours(12, 0, 0, 0)); // 12:00
    const dateDebutApresMidi = new Date(dateObj.setHours(13, 0, 0, 0)); // 13:00
    const dateFinApresMidi = new Date(dateObj.setHours(17, 0, 0, 0)); // 17:00

    // Récupérer les rendez-vous du jour pendant les horaires de travail
    const rendezVousMatin = await RendezVous.find({
      datevalide: { $gte: dateDebutMatin, $lt: dateFinMatin }
    }).select('idmecanicien');
    
    const rendezVousApresMidi = await RendezVous.find({
      datevalide: { $gte: dateDebutApresMidi, $lt: dateFinApresMidi }
    }).select('idmecanicien');

    const tousRendezVous = [...rendezVousMatin, ...rendezVousApresMidi];

    // Compter les rendez-vous par mécanicien
    const rdvParMecanicien = {};
    tousRendezVous.forEach(rdv => {
      const idMecanicien = rdv.idmecanicien.toString();
      rdvParMecanicien[idMecanicien] = (rdvParMecanicien[idMecanicien] || 0) + 1;
    });

    // Filtrer les mécaniciens disponibles (moins de 6 rendez-vous dans la journée)
    const mecaniciensDisponibles = mecaniciens.filter(mecanicien => {
      const idMecanicien = mecanicien._id.toString();
      return !rdvParMecanicien[idMecanicien] || rdvParMecanicien[idMecanicien] < 6;
    });

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
      
      // Récupère l'heure locale
      const hours = date.getHours(); 
      const minutes = date.getMinutes();

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

    // Sauvegarde des dates locales en UTC avant de les stocker
    const newRendezVous = new RendezVous({
      iddevis,
      propositiondates: validTimes.map(({ date }) => {
        // Conversion de la date locale en UTC avant de la sauvegarder en base
        const localDate = new Date(date);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset()); // Convertit en UTC
        return localDate; // Sauvegarde la date en UTC
      }),
      infosup: infosup || "", // Valeur par défaut si non fournie
      status: 2, // Status de proposition de date
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
    
    // Récupérer tous les utilisateurs avec le status 'manager' pour envoyer les notifications
    const managers = await User.find({ status: 3 }); // Récupérer tous les utilisateurs avec le status 'manager'
    if (managers && managers.length > 0) {
      for (const manager of managers) {
      const notificationManager = new Notification({
        iduser: manager._id,
        type: "Nouvelle demande de rendez-vous",
        message: `Une nouvelle demande de rendez-vous a été faite par le client ${client.nom} ${client.prenom}.`,
        status: false,
        date_creation: new Date(),
      });

      // Sauvegarde de la notification pour chaque manager
      await notificationManager.save();
      }
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
  RendezVous.find({datevalide: null, idmecanicien: null, status: 0})
    .then(rendezVous => res.status(200).json(rendezVous))
    .catch(err => res.status(500).json({ error: 'Erreur lors de la récupération des devis', err }));
};

exports.getAllRendezVousValides = async (req, res) => {
  try {
    console.log("Fetching all rendez-vous valides");

    // Récupérer la date et l'avancement de la requête (si fournis)
    const { dateheure, avancement } = req.body;
    console.log("Date et heure reçues:", dateheure);
    console.log("Avancement reçu:", avancement);

    // 1. Trouver tous les devis associés
    const devisList = await Devis.find().select('_id immatriculation idprestations');

    if (devisList.length === 0) {
      return res.status(404).json({ message: "Aucun devis trouvé." });
    }

    // 2. Extraire les ID des devis trouvés
    const devisIds = devisList.map(devis => devis._id);

    // 3. Préparer la condition de filtrage pour la date
    let filters = { iddevis: { $in: devisIds }, idmecanicien: { $ne: null }, status: 1 };

    if (dateheure) {
      const searchDate = new Date(dateheure);
      console.log("Date recherchée:", searchDate);

      if (isNaN(searchDate)) {
      return res.status(400).json({ message: "La date et l'heure spécifiées sont invalides." });
      }

      const searchDateWithoutSeconds = new Date(
      searchDate.getFullYear(),
      searchDate.getMonth(),
      searchDate.getDate(),
      searchDate.getHours(),
      searchDate.getMinutes()
      );

      filters.datevalide = searchDateWithoutSeconds;
    }

    // 4. Appliquer le filtre sur l'avancement s'il est fourni et valide
    if ([1, 2, 3].includes(Number(avancement))) {
      filters.avancement = Number(avancement);
    }

    // 5. Trouver les rendez-vous valides avec les filtres appliqués
    const rendezVousList = await RendezVous.find(filters)
      .populate({
        path: 'iddevis',
        select: 'immatriculation prestations idclient',
        populate: [
          { 
            path: 'prestations.idprestation', 
            model: 'Prestation', 
            select: 'nom' 
          },
          { path: 'idclient', model: 'User', select: 'nom prenom' }
        ]
      })
      .populate({
        path: 'idmecanicien',
        select: 'nom prenom'
      })
      .select('datevalide avancement').sort({ _id: -1 });;

    if (rendezVousList.length === 0) {
      return res.status(404).json({ message: "Aucun rendez-vous valide trouvé avec ces critères." });
    }

    // 6. Formatter la réponse correctement
    const result = rendezVousList.map(rdv => ({
      idrendezvous: rdv._id,
      iddevis: rdv.iddevis._id,
      datevalide: rdv.datevalide,
      immatriculation: rdv.iddevis?.immatriculation || 'N/A',
      client: `${rdv.iddevis?.idclient?.nom || ''} ${rdv.iddevis?.idclient?.prenom || ''}`,
      mecanicien: `${rdv.idmecanicien?.nom || ''} ${rdv.idmecanicien?.prenom || ''}`,
      avancement: rdv.avancement,
      prestations: rdv.iddevis?.prestations.map(prestation => ({
        idprestation: prestation.idprestation._id,  // Extraire l'ID directement
        nom: prestation.idprestation.nom || 'Non spécifié',  // Extraire le nom de la prestation
        avancement: prestation.avancement
      })) || []
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des rendez-vous:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous", details: err });
  }
};




exports.getAllRendezVousValidesByClient = async (req, res) => {
  try {
    console.log("Fetching all rendez-vous valides par idclient");
    const { idclient } = req.params;
    console.log("ID Client reçu:", idclient);

    // 1. Trouver tous les devis associés à ce client
    const devisList = await Devis.find({ idclient: idclient }).select('_id immatriculation idprestations');

    if (devisList.length === 0) {
      return res.status(404).json({ message: "Aucun devis trouvé pour ce client." });
    }

    // 2. Extraire les ID des devis trouvés
    const devisIds = devisList.map(devis => devis._id);

    // 3. Trouver les rendez-vous qui ont un iddevis correspondant
    const rendezVousList = await RendezVous.find({
      iddevis: { $in: devisIds },
      datevalide: { $ne: null },
      idmecanicien: { $ne: null },
      status: 1
    })
    .populate({
      path: 'iddevis',
        select: 'immatriculation prestations idclient',
        populate: [
          { 
            path: 'prestations.idprestation', 
            model: 'Prestation', 
            select: 'nom' 
          },
          { path: 'idclient', model: 'User', select: 'nom prenom' }
        ]
    })
    .populate({
      path: 'idmecanicien', // Récupérer les informations sur le mécanicien
      select: 'nom prenom' // Sélectionner seulement le nom et prénom du mécanicien
    })
    .select('datevalide avancement').sort({ _id: -1 }); // Sélectionner les champs nécessaires

    if (rendezVousList.length === 0) {
      return res.status(404).json({ message: "Aucun rendez-vous valide trouvé pour ce client." });
    }

    // 4. Formatter la réponse pour afficher uniquement les champs nécessaires
    const result = rendezVousList.map(rdv => ({
      idrendezvous: rdv._id,
      iddevis: rdv.iddevis._id,
      datevalide: rdv.datevalide,
      immatriculation: rdv.iddevis?.immatriculation || 'N/A',
      mecanicien: `${rdv.idmecanicien?.nom || ''} ${rdv.idmecanicien?.prenom || ''}`,
      avancement: rdv.avancement,
      prestations: rdv.iddevis?.prestations.map(prestation => ({
        idprestation: prestation.idprestation._id,  // Extraire l'ID directement
        nom: prestation.idprestation.nom || 'Non spécifié',  // Extraire le nom de la prestation
        avancement: prestation.avancement
      })) || []
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des rendez-vous:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous", details: err });
  }
};

exports.getAllRendezVousValidesByMecanicien = async (req, res) => {
  try {
    console.log("Fetching all rendez-vous valides par mécanicien");

    // Récupérer les paramètres de la requête (si fournis)
    const { idmecanicien, dateheure, avancement } = req.body;
    console.log("ID Mécanicien reçu:", idmecanicien);
    console.log("Date et heure reçues:", dateheure);
    console.log("Avancement reçu:", avancement);

    // Vérifier si l'id du mécanicien est fourni
    if (!idmecanicien) {
      return res.status(400).json({ message: "L'ID du mécanicien est requis." });
    }

    // 1. Trouver tous les devis associés
    const devisList = await Devis.find().select('_id immatriculation idprestations').sort({ _id: -1 });;

    if (devisList.length === 0) {
      return res.status(404).json({ message: "Aucun devis trouvé." });
    }

    // 2. Extraire les ID des devis trouvés
    const devisIds = devisList.map(devis => devis._id);

    // 3. Préparer les filtres de recherche
    let filters = { 
      iddevis: { $in: devisIds }, 
      idmecanicien,  // Filtrer par mécanicien
      status: 1 
    };

    // 4. Appliquer le filtre sur la date si elle est fournie
    if (dateheure) {
      const searchDate = new Date(dateheure);
      console.log("Date recherchée:", searchDate);

      if (isNaN(searchDate)) {
      return res.status(400).json({ message: "La date et l'heure spécifiées sont invalides." });
      }

      const searchDateWithoutSeconds = new Date(
      searchDate.getFullYear(),
      searchDate.getMonth(),
      searchDate.getDate(),
      searchDate.getHours(),
      searchDate.getMinutes()
      );

      filters.datevalide = searchDateWithoutSeconds;
    }

    // 5. Appliquer le filtre sur l'avancement s'il est fourni et valide
    if ([1, 2, 3].includes(Number(avancement))) {
      filters.avancement = Number(avancement);
    }

    // 6. Rechercher les rendez-vous valides avec les filtres appliqués
    const rendezVousList = await RendezVous.find(filters)
      .populate({
        path: 'iddevis',
        select: 'immatriculation prestations idclient',
        populate: [
          { 
            path: 'prestations.idprestation', 
            model: 'Prestation', 
            select: 'nom' 
          },
          { path: 'idclient', model: 'User', select: 'nom prenom' }
        ]
      })
      .populate({
        path: 'idmecanicien',
        select: 'nom prenom'
      })
      .select('datevalide avancement').sort({ _id: -1 });

    if (rendezVousList.length === 0) {
      return res.status(404).json({ message: "Aucun rendez-vous valide trouvé avec ces critères." });
    }

    // 7. Formatter la réponse correctement
    const result = rendezVousList.map(rdv => ({
      idrendezvous: rdv._id,
      iddevis: rdv.iddevis._id,
      datevalide: rdv.datevalide,
      immatriculation: rdv.iddevis?.immatriculation || 'N/A',
      client: `${rdv.iddevis?.idclient?.nom || ''} ${rdv.iddevis?.idclient?.prenom || ''}`,
      mecanicien: `${rdv.idmecanicien?.nom || ''} ${rdv.idmecanicien?.prenom || ''}`,
      avancement: rdv.avancement,
      prestations: rdv.iddevis?.prestations.map(prestation => ({
        idprestation: prestation.idprestation._id,  // Extraire l'ID directement
        nom: prestation.idprestation.nom || 'Non spécifié',  // Extraire le nom de la prestation
        avancement: prestation.avancement
      })) || []

    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des rendez-vous:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous", details: err });
  }
};


exports.getAllRendezVousEnAttente = async (req, res) => {
  try {
    console.log("Fetching all rendez-vous en attente");

    // 1. Trouver les rendez-vous en attente liés aux devis
    const rendezVousList = await RendezVous.find({
      iddevis: { $ne: null },
      datevalide: null,
      idmecanicien: null,
      status: 2
    })
    .select('createdAt infosup _id iddevis propositiondates').sort({ createdAt: -1 });

    if (rendezVousList.length === 0) {
      return res.status(404).json({ message: "Aucun rendez-vous en attente trouvé." });
    }

    // 2. Récupérer les détails associés à chaque rendez-vous
    const result = await Promise.all(rendezVousList.map(async (rdv) => {
      const devis = await Devis.findById(rdv.iddevis).select('idclient prestations');

      if (!devis) {
        return null; // Si le devis est introuvable, passer au suivant
      }

      // Récupérer les informations du client
      const client = await User.findById(devis.idclient).select('nom prenom');

      // Récupérer les prestations associées au devis
      // const prestations = await Prestation.find({ _id: { $in: devis.prestations } }).select('nom');
      const prestations = await Prestation.find({ _id: { $in: devis.prestations.map(p => p.idprestation) } }).select('nom');

      return {
        idrendezvous: rdv._id,
        iddevis: rdv.iddevis,
        propositiondates: rdv.propositiondates || [],
        idclient: devis.idclient,
        client: `${client?.prenom || ''} ${client?.nom || ''}`,
        prestations: prestations.map(prestation => prestation.nom), // Récupération des noms des prestations
        infosup: rdv.infosup || 'Aucun motif'
      };
    }));

    // Filtrer les rendez-vous valides (supprimer les null si un devis était inexistant)
    res.status(200).json(result.filter(rdv => rdv !== null));

  } catch (err) {
    console.error("Erreur lors de la récupération des rendez-vous en attente:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous en attente", details: err });
  }
};





exports.getAllRendezVousEnAttenteByClient = async (req, res) => {
  try {
    console.log("Fetching all rendez-vous en attente");
    const { idclient } = req.params;
    console.log("ID Client reçu:", idclient);

    // 1. Trouver tous les devis associés à ce client
    const devisList = await Devis.find({ idclient: idclient }).select('_id prestations').sort({ _id: -1 });

    if (devisList.length === 0) {
      return res.status(404).json({ message: "Aucun devis trouvé pour ce client." });
    }

    // 2. Extraire les ID des devis trouvés et les prestations associées
    const devisIds = devisList.map(devis => devis._id);
    const prestationsIds = devisList.flatMap(devis => devis.prestations.map(p => p.idprestation)); // Récupérer tous les ID des prestations

    // 3. Trouver les rendez-vous en attente liés aux devis du client
    const rendezVousList = await RendezVous.find({
      iddevis: { $in: devisIds },
      datevalide: null,
      idmecanicien: null,
      status: 2
    })
    .select('createdAt infosup _id iddevis propositiondates');

    if (rendezVousList.length === 0) {
      return res.status(404).json({ message: "Aucun rendez-vous en attente trouvé pour ce client." });
    }

    // 4. Récupérer les noms des prestations
    const prestations = await Prestation.find({ _id: { $in: prestationsIds } }).select('nom');

    // 5. Associer les prestations à chaque rendez-vous
    const result = rendezVousList.map(rdv => {
      // Trouver les prestations associées au devis de ce rendez-vous
      const devis = devisList.find(d => d._id.toString() === rdv.iddevis.toString());
      const prestationsAssociees = devis.prestations.map(p => {
        // Chercher chaque prestation par son ID dans la liste des prestations
        const prestation = prestations.find(prest => prest._id.toString() === p.idprestation.toString());
        return prestation ? prestation.nom : null;
      }).filter(nom => nom !== null); // Filtrer les nulls si une prestation n'est pas trouvée

      return {
        idrendezvous: rdv._id,
        iddevis: rdv.iddevis,
        createdAt: rdv.createdAt,
        infosup: rdv.infosup || 'Aucun motif',
        propositiondates: rdv.propositiondates,
        prestations: prestationsAssociees, // Liste des noms de prestations
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des rendez-vous en attente:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des rendez-vous en attente", details: err });
  }
};

exports.getDetailsDevisByRendezVous = async (req, res) => {
  try {
    console.log("Fetching details of the devis by idrendezvous");
    const { idrendezvous } = req.params;
    console.log("ID Rendez-vous reçu:", idrendezvous);

    // 1. Trouver le rendez-vous associé à l'ID donné
    const rendezVous = await RendezVous.findById(idrendezvous).select('iddevis');
 
    if (!rendezVous) {
      return res.status(404).json({ message: "Aucun rendez-vous trouvé avec cet ID." });
    }

    // 2. Trouver le devis correspondant avec les détails demandés
    const devisItem = await Devis.findById(rendezVous.iddevis)
      .populate({ path: 'idtypemoteur', select: 'nom' }) // Récupérer le nom du type moteur
      .populate({ path: 'idmodele', select: 'nom' }) // Récupérer le nom du modèle
      .populate({ 
        path: 'prestations', 
        populate: { 
          path: 'idprestation',  // Peupler les informations détaillées sur chaque prestation
          select: 'nom prixunitaire idcategorieprestation', // Inclure nom, prix unitaire et catégorie
          populate: { path: 'idcategorieprestation', select: 'nom' } // Peupler la catégorie de prestation
        },
        select: 'idprestation avancement' 
      })
      .populate({ 
        path: 'idclient', // Ajout de la récupération des informations du client
        select: 'nom prenom telephone email'
      })
      .select('_id immatriculation idtypemoteur idmodele idclient accepte prestations');

    if (!devisItem) {
      return res.status(404).json({ message: "Aucun devis trouvé pour ce rendez-vous." });
    }

    // 3. Calculer le prix total (somme des prix des prestations)
    const prixtotal = devisItem.prestations.reduce((sum, prestation) => {
      return sum + (prestation.idprestation ? prestation.idprestation.prixunitaire : 0);
    }, 0);

    // 4. Structurer la réponse
    const result = {
      _id: devisItem._id,
      immatriculation: devisItem.immatriculation,
      idtypemoteur: devisItem.idtypemoteur?._id,
      typemoteur: devisItem.idtypemoteur?.nom || 'N/A',
      idmodele: devisItem.idmodele?._id,
      modele: devisItem.idmodele?.nom || 'N/A',
      clientnom: devisItem.idclient?.nom || 'N/A',
      clientprenom: devisItem.idclient?.prenom || 'N/A',
      clienttelephone: devisItem.idclient?.telephone || 'N/A',
      clientemail: devisItem.idclient?.email || 'N/A',
      prixtotal, // Prix total calculé dynamiquement
      accepte: devisItem.accepte,
      prestations: devisItem.prestations.map(prestation => ({
        idprestation: prestation.idprestation._id, // Récupérer uniquement l'_id de la prestation
        nom: prestation.idprestation.nom,  // Nom de la prestation
        avancement: prestation.avancement, // Avancement de la prestation
        prixunitaire: prestation.idprestation.prixunitaire, // Prix unitaire de la prestation
        idcategorieprestation: prestation.idprestation.idcategorieprestation._id, // L'ID de la catégorie de prestation
        nomcategorieprestation: prestation.idprestation.idcategorieprestation.nom // Nom de la catégorie de prestation
      })) || []
    };

    res.status(200).json(result);
  } catch (err) {
    console.error("Erreur lors de la récupération des détails du devis:", err);
    res.status(500).json({ error: "Erreur lors de la récupération des détails du devis", details: err });
  }
};

exports.changerAvancementRendezVous = async (req, res) => {
  try {
    const { idrendezvous, idprestation } = req.body; // ID du rendez-vous et de la prestation à mettre à jour
    console.log("ID Rendez-vous reçu:", idrendezvous);
    console.log("ID Prestation reçu:", idprestation);

    // 1. Trouver le rendez-vous par son ID
    const rendezVous = await RendezVous.findById(idrendezvous);
    if (!rendezVous) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // 2. Trouver le devis lié au rendez-vous
    const devis = await Devis.findById(rendezVous.iddevis);
    if (!devis) {
      return res.status(404).json({ message: "Devis non trouvé." });
    }

    // 3. Trouver la prestation spécifique dans le tableau des prestations du devis
    const prestation = devis.prestations.find(p => p.idprestation.toString() === idprestation);
    if (!prestation) {
      return res.status(404).json({ message: "Prestation non trouvée dans ce devis." });
    }

    // 4. Vérifier si l'avancement de la prestation est déjà à 3 (terminé)
    if (prestation.avancement >= 3) {
      return res.status(400).json({ message: "L'avancement de cette prestation ne peut plus être modifié." });
    }

    // Incrémenter l'avancement de la prestation
    prestation.avancement += 1;

    // Sauvegarder le devis avec la prestation mise à jour
    await devis.save();

    // 5. Mettre à jour l'avancement du rendez-vous en fonction des prestations du devis
    const allPrestationsTerminees = devis.prestations.every(p => p.avancement === 3);
    const somePrestationsEnCours = devis.prestations.some(p => p.avancement === 2);
    const allPrestationsEnAttente = devis.prestations.every(p => p.avancement === 1);

    // Mettre à jour l'avancement du rendez-vous
    if (allPrestationsTerminees) {
      // Si toutes les prestations sont terminées, mettre l'avancement du rendez-vous à 3
      rendezVous.avancement = 3;
    } else if (somePrestationsEnCours) {
      // Si une des prestations est en cours, mettre l'avancement du rendez-vous à 2
      rendezVous.avancement = 2;
    } else if (allPrestationsEnAttente) {
      // Si toutes les prestations sont en attente, mettre l'avancement du rendez-vous à 1
      rendezVous.avancement = 1;
    }

    // Sauvegarder le rendez-vous avec l'avancement mis à jour
    await rendezVous.save();

    // 6. Vérifier si toutes les prestations sont terminées et envoyer la notification si nécessaire
    if (allPrestationsTerminees) {
      const idclient = devis.idclient;  // L'ID du client est dans le devis
      const immatriculation = devis.immatriculation;  // Récupérer l'immatriculation du véhicule
      const dateRendezVous = new Date(rendezVous.datevalide);  // Récupérer la date du rendez-vous

      // Convertir la date en UTC et la formater pour une lecture lisible
      const dateFormatted = dateRendezVous.toISOString().replace('T', ' ').split('.')[0]; // Format: YYYY-MM-DD HH:mm:ss

      // Création de la notification pour le client
      const notificationClient = new Notification({
        iduser: idclient,
        type: "Prestation terminée",
        message: `Les prestations du rendez-vous du ${dateFormatted} sur votre véhicule (Immatriculation: ${immatriculation}) sont terminées. Vous pouvez maintenant récupérer votre véhicule.`,
        status: false, // Notification non lue
        date_creation: new Date(),
      });

      // Sauvegarde de la notification pour le client
      await notificationClient.save();
      console.log("Notification envoyée au client.");
    }

    // 7. Retourner la réponse avec les nouvelles informations
    res.status(200).json({
      message: "Avancement de la prestation et du rendez-vous mis à jour.",
      avancementPrestation: prestation.avancement,
      avancementRendezVous: rendezVous.avancement
    });

  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'avancement de la prestation:", err);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour de l'avancement", details: err });
  }
};


exports.ajouterPrestationRendezVous = async (req, res) => {
  try {
    const { idrendezvous, idprestation } = req.body;
    console.log("ID Rendez-vous reçu:", idrendezvous);
    console.log("ID Prestation reçu:", idprestation);

    // Vérifier si les IDs sont valides
    if (!mongoose.Types.ObjectId.isValid(idrendezvous) || !mongoose.Types.ObjectId.isValid(idprestation)) {
      return res.status(400).json({ message: "ID de rendez-vous ou de prestation invalide." });
    }

    // Trouver le rendez-vous par son ID
    const rendezVous = await RendezVous.findById(idrendezvous);
    if (!rendezVous) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Trouver la prestation
    const prestation = await Prestation.findById(idprestation);
    if (!prestation) {
      return res.status(404).json({ message: "Prestation non trouvée." });
    }

    // Trouver le devis associé au rendez-vous
    const devis = await Devis.findById(rendezVous.iddevis);
    if (!devis) {
      return res.status(404).json({ message: "Devis non trouvé." });
    }

    // Vérifier si la prestation est déjà présente dans le devis
    const prestationExistante = devis.prestations.find(p => p.idprestation.toString() === idprestation);
    if (prestationExistante) {
      return res.status(400).json({ message: "Cette prestation est déjà ajoutée au devis." });
    }

    // Ajouter la prestation avec un avancement à 1 (attente)
    devis.prestations.push({ idprestation, avancement: 1 });

    // Sauvegarder le devis avec la nouvelle prestation
    await devis.save();

    // Mettre à jour l'avancement du rendez-vous
    const allPrestationsTerminees = devis.prestations.every(p => p.avancement === 3);
    const somePrestationsEnCours = devis.prestations.some(p => p.avancement === 2);
    const allPrestationsEnAttente = devis.prestations.every(p => p.avancement === 1);

    if (allPrestationsTerminees) {
      rendezVous.avancement = 3;
    } else if (somePrestationsEnCours) {
      rendezVous.avancement = 2;
    } else if (allPrestationsEnAttente) {
      rendezVous.avancement = 1;
    } else {
      rendezVous.avancement = 2;
    }

    // Sauvegarder le rendez-vous mis à jour
    await rendezVous.save();

    res.status(200).json({
      message: "Prestation ajoutée et avancement du rendez-vous mis à jour.",
      prestations: devis.prestations,
      avancementRendezVous: rendezVous.avancement
    });

  } catch (err) {
    console.error("Erreur lors de l'ajout de la prestation:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout de la prestation", details: err });
  }
};



exports.supprimerPrestationRendezVous = async (req, res) => {
  try {
    const { idrendezvous, idprestation } = req.body; // Récupération des ID de rendez-vous et de prestation
    console.log("ID Rendez-vous reçu:", idrendezvous);
    console.log("ID Prestation reçu:", idprestation);

    // Trouver le rendez-vous par son ID
    const rendezVous = await RendezVous.findById(idrendezvous);
    if (!rendezVous) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    // Trouver le devis associé au rendez-vous
    const devis = await Devis.findById(rendezVous.iddevis);
    if (!devis) {
      return res.status(404).json({ message: "Devis non trouvé." });
    }

    // Trouver et vérifier la prestation à supprimer
    const prestation = devis.prestations.find(p => p.idprestation.toString() === idprestation);
    if (!prestation) {
      return res.status(404).json({ message: "Prestation non trouvée." });
    }

    if(devis.prestations.length === 1) { 
      return res.status(400).json({ message: "Un rendez-vous doit avoir au moins une prestation." });
    }
    
    // Vérifier que la prestation à supprimer a un avancement en attente ou en cours (1 ou 2)
    if (![1, 2].includes(prestation.avancement)) {
      return res.status(400).json({ message: "La prestation ne peut être supprimée que si elle est en attente ou en cours." });
    }

    // Supprimer la prestation du tableau des prestations
    devis.prestations = devis.prestations.filter(p => p.idprestation.toString() !== idprestation);

    // Sauvegarder le devis après la suppression de la prestation
    await devis.save();

    // Vérifier les avancements des prestations pour mettre à jour l'avancement du rendez-vous
    const allPrestationsTerminees = devis.prestations.every(p => p.avancement === 3);
    const somePrestationsEnCours = devis.prestations.some(p => p.avancement === 2);
    const allPrestationsEnAttente = devis.prestations.every(p => p.avancement === 1);

    // Mettre à jour l'avancement du rendez-vous en fonction des prestations du devis
    if (allPrestationsTerminees) {
      rendezVous.avancement = 3; // Toutes les prestations sont terminées
    } else if (somePrestationsEnCours) {
      rendezVous.avancement = 2; // Au moins une prestation est en cours
    } else if (allPrestationsEnAttente) {
      rendezVous.avancement = 1; // Toutes les prestations sont en attente
    } else {
      // Si il y a un mix entre prestations en attente, en cours et terminées, on considère l'état comme "en cours"
      rendezVous.avancement = 2;
    }

    // Sauvegarder le rendez-vous avec l'avancement mis à jour
    await rendezVous.save();

    // Retourner la réponse avec les prestations mises à jour
    res.status(200).json({
      message: "Prestation supprimée du devis et avancement du rendez-vous mis à jour.",
      prestations: devis.prestations,
      avancementRendezVous: rendezVous.avancement
    });

  } catch (err) {
    console.error("Erreur lors de la suppression de la prestation:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de la prestation", details: err });
  }
};
