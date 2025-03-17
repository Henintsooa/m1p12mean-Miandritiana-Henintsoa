const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/notifications', require('./routes/NotificationRoutes'));
app.use('/rendezvous', require('./routes/RendezVousRoutes'));
app.use('/devis', require('./routes/DevisRoutes'));
app.use('/prestation', require('./routes/PrestationRoutes'));
app.use('/categorieprestation', require('./routes/CategoriePrestationRoutes'));
app.use('/modele', require('./routes/ModeleRoutes'));
app.use('/typemoteur', require('./routes/TypeMoteurRoutes'));
app.use('/users', require('./routes/UserRoutes'));

// Démarrer le serveur
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
