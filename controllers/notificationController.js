const Notification = require("../models/Notification")
const mongoose = require("mongoose");

exports.getNotificationsByUser = async (req, res) => {
  try {
    const { iduser } = req.params;
    console.log("ID utilisateur reçu:", iduser);
    if (!mongoose.Types.ObjectId.isValid(iduser)) {
      return res.status(400).json({ error: "ID utilisateur invalide." });
    }
    const notifications = await Notification.find({ iduser }).sort({ date_creation: -1 });
    console.log("Notifications trouvées :", notifications);
    res.status(200).json(notifications);
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { idnotification } = req.params;
    const { iduser } = req.body; // Récupérer l'utilisateur connecté

    if (!mongoose.Types.ObjectId.isValid(idnotification)) {
      return res.status(400).json({ error: "ID de notification invalide." });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: idnotification, iduser }, // Vérifier que la notif appartient à l'utilisateur
      { status: true, read_at: new Date() }, // Ajout du timestamp
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification non trouvée ou accès refusé." });
    }

    res.status(200).json({ message: "Notification marquée comme lue.", notification });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};



exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const { iduser } = req.body; // Récupérer l'utilisateur connecté

    if (!mongoose.Types.ObjectId.isValid(iduser)) {
      return res.status(400).json({ error: "ID utilisateur invalide." });
    }

    const result = await Notification.updateMany(
      { iduser, status: false }, // On met à jour uniquement les non lues
      { status: true, read_at: new Date() }
    );

    res.status(200).json({ message: `${result.modifiedCount} notifications marquées comme lues.` });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des notifications :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
