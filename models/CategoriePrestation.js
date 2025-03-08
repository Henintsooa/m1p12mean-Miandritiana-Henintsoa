const mongoose = require('mongoose');
const CategoriePrestationSchema = new mongoose.Schema({
 nom: { type: String, required: true },

}, { timestamps: true });
module.exports = mongoose.model('CategoriePrestation', CategoriePrestationSchema, 'categoriePrestation');
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('CategoriePrestation').collection.name);
