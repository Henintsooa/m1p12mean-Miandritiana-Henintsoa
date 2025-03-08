const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
 nom: { type: String, required: true },

}, { timestamps: true });
module.exports = mongoose.model('Modele', UserSchema, 'modele');
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Modele').collection.name);
