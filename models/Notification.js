const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
 iduser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 type: { type: String, required: true },
 message: { type: String, required: true, text: true  },
 status: { type: String, default: false },
 date_creation: { type: Date, default: Date.now },
}, { timestamps: true });
module.exports = mongoose.model('Notification', NotificationSchema, 'notification');    
console.log("Nom de la collection utilisée par Mongoose :", mongoose.model('Notification').collection.name);
