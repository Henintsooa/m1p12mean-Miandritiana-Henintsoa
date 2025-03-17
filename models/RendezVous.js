const mongoose = require('mongoose');
const RendezVousSchema = new mongoose.Schema({
    iddevis: { type: mongoose.Schema.Types.ObjectId, ref: 'Devis', required: true },
    propositiondates: [{ type: Date, required: true }],
    infosup: { type: String, default: null },
    status: { type: Number },
    datevalide: { type: Date, default: null },
    idmecanicien: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    avancement: { type: Number, default: 0 },
  }, { timestamps: true });

module.exports = mongoose.model('RendezVous', RendezVousSchema, 'rendezVous');
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('RendezVous').collection.name);
