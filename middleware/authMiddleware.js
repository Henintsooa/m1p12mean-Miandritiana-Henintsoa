const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT et le rôle de l'utilisateur
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Extraire le token du header

    if (!token) {
        return res.status(401).json({ message: "Accès refusé. Aucun token trouvé." });
    }

    try {
        // Vérifier et décoder le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ajouter l'ID utilisateur et le rôle à l'objet request pour utilisation future
        req.user = decoded;

        next(); // Passer au prochain middleware ou à la route suivante
    } catch (error) {
        return res.status(401).json({ message: "Token invalide." });
    }
};

// Middleware pour vérifier si l'utilisateur a un rôle spécifique
const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé. Vous n'avez pas les droits suffisants." });
        }
        next(); // L'utilisateur a le bon rôle, continuer
    };
};

module.exports = { verifyToken, verifyRole };
