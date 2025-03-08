const mongoose = require('mongoose');
const TypemoteurSchema = new mongoose.Schema({
    nom: { type: String, required: true },
  }, { timestamps: true });

module.exports = mongoose.model('typeMoteur',TypemoteurSchema,'typeMoteur');
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('typeMoteur').collection.name);
