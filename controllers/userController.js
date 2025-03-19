require('dotenv').config();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Créer un utilisateur 
// exports.createUser = async (req, res) => {
//     try {
//         console.log("Données reçues:", req.body);
//         const user = new User(req.body);
//         const savedUser = await user.save();
//         res.status(201).json(savedUser);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

// Créer un utilisateur (uniquement client)

// Connexion d'un utilisateur
exports.loginUser = async (req, res) => {
    try {
        const { email, mdp } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect." });
        }

        // Vérifier si la clé secrète JWT est définie
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "La clé secrète pour le JWT n'est pas définie." });
        }
        
        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(mdp, user.mdp);
        if (!isMatch) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect." });
        }

        // Générer un token JWT avec le rôle
        const token = jwt.sign(
            { role: user.status }, // Le rôle est stocké sous "status"
            process.env.JWT_SECRET, // Clé secrète
            { expiresIn: '7d' } // Expiration du token (7 jours)
        );

        // Envoyer le token et le rôle
        res.json({
            message: "Connexion réussie.",
            token,
            iduser: user._id, // Inclure l'iduser dans la réponse
            role: user.status,
            nom: user.nom,
            prenom: user.prenom,
        });
    } catch (error) {
        console.error("Erreur lors de la connexion:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.createClient = async (req, res) => {
    try {
        const { nom, prenom, email, telephone, mdp } = req.body;

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(mdp, 10);
        
        // Créer l'utilisateur avec le statut "client"
        const user = new User({
            status: 1,  // Imposé automatiquement (client)
            nom,
            prenom,
            email,
            telephone,
            mdp: hashedPassword,
        });
        console.log("Inscription de client");
        console.log("données reçues:", req.body);
        // Sauvegarder l'utilisateur
        const savedUser = await user.save();
        res.status(201).json(savedUser);

    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Récupérer tous les mécaniciens (status=2)
exports.getAllMecaniciens = async (req, res) => {
    try {
        // Trouver tous les mécaniciens
        const mecaniciens = await User.find({ status: 2 }).select('nom prenom email telephone');
        
        if (mecaniciens.length === 0) {
            return res.status(404).json({ message: "Aucun mécanicien trouvé." });
        }

        res.status(200).json(mecaniciens);
    } catch (error) {
        console.error("Erreur lors de la récupération des mécaniciens:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};


exports.createMecanicien = async (req, res) => {
    try {
        const { nom, prenom, email, telephone, mdp } = req.body;

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(mdp, 10);
        
        // Créer l'utilisateur avec le statut "mecanicien"
        const user = new User({
            status: 2,  // Imposé automatiquement (mecanicien")
            nom,
            prenom,
            email,
            telephone,
            mdp: hashedPassword,
        });
        console.log("Inscription de mecanicien");
        console.log("données reçues:", req.body);
        // Sauvegarder l'utilisateur
        const savedUser = await user.save();
        res.status(201).json(savedUser);

    } catch (error) {
        console.error("Erreur lors de l'inscription:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Modifier un mécanicien
exports.updateMecanicien = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, telephone } = req.body;

        // Vérifier si l'utilisateur existe
        const mecanicien = await User.findById(id);
        if (!mecanicien || mecanicien.status !== 2) {
            return res.status(404).json({ message: "Mécanicien non trouvé ou mauvais statut." });
        }

        // Mettre à jour les informations
        mecanicien.nom = nom || mecanicien.nom;
        mecanicien.prenom = prenom || mecanicien.prenom;
        mecanicien.email = email || mecanicien.email;
        mecanicien.telephone = telephone || mecanicien.telephone;

        // Sauvegarder les modifications
        const updatedMecanicien = await mecanicien.save();

        res.status(200).json(updatedMecanicien);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du mécanicien:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { oldpassword, newpassword } = req.body;
        const { id } = req.params; // Assuming the user is authenticated and we have access to the user ID from the JWT token

        // Trouver l'utilisateur par son ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Vérifier l'ancien mot de passe
        const match = await bcrypt.compare(oldpassword, user.mdp);
        if (!match) {
            return res.status(400).json({ message: "L'ancien mot de passe est incorrect." });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newpassword, 10);

        // Mettre à jour le mot de passe
        user.mdp = hashedPassword;

        // Sauvegarder les modifications
        await user.save();

        res.status(200).json({ message: "Mot de passe changé avec succès." });
    } catch (error) {
        console.error("Erreur lors du changement de mot de passe:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
