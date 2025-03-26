const mongoose = require('mongoose');
const DevisSchema = new mongoose.Schema({
    immatriculation: { type: String, required: true },
    idtypemoteur: { type: mongoose.Schema.Types.ObjectId, ref: 'typeMoteur', required: true },
    idmodele: { type: mongoose.Schema.Types.ObjectId, ref: 'Modele', required: true },
    idclient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prestations: [{
      idprestation: { type: mongoose.Schema.Types.ObjectId, ref: 'Prestation' },  // Référence à la prestation
      avancement: { type: Number, default: 1 } // Avancement de la prestation, initialisé à 1
    }],
    prixtotal: { type: Number, default: 0 },
    accepte: { type: Boolean, default: false },
  }, { timestamps: true });

module.exports = mongoose.model('Devis', DevisSchema);
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Devis').collection.name);
