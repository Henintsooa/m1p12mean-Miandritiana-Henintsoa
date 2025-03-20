const mongoose = require('mongoose');
const PrestationSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    idtypemoteur: { type: mongoose.Schema.Types.ObjectId, ref: 'typeMoteur', required: true },
    idmodele: { type: mongoose.Schema.Types.ObjectId, ref: 'Modele', required: true },
    idcategorieprestation: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoriePrestation', required: true },
    prixunitaire: { type: Number, required: true },
    archive: { type: Boolean, default: false } // Ajout du champ archive
  }, { timestamps: true });

module.exports = mongoose.model('Prestation', PrestationSchema,'prestation');
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Prestation').collection.name);
