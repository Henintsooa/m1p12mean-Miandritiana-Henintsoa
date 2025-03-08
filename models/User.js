const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
 status: { type: String, required: true },
 nom: { type: String, required: true },
 prenom: { type: String, required: true },
 email: { type: String, required: true },
 telephone: { type: String, required: true },
 mdp: { type: String, required: true },

}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema, 'user');
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('User').collection.name);
