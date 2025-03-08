const mongoose = require('mongoose');
const DevisSchema = new mongoose.Schema({
    immatriculation: { type: String, required: true },
    idtypemoteur: { type: mongoose.Schema.Types.ObjectId, ref: 'typeMoteur', required: true },
    idmodele: { type: mongoose.Schema.Types.ObjectId, ref: 'Modele', required: true },
    idclient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    idprestations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prestation' }], // Tableau de références vers la collection Prestations
  }, { timestamps: true });

module.exports = mongoose.model('Devis', DevisSchema);
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Devis').collection.name);
