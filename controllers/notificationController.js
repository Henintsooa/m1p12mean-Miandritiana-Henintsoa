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