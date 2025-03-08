const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
// router.post('/', userController.createUser);
router.delete('/:id', userController.deleteUser);
router.post('/inscription', userController.createClient);
router.post('/login', userController.loginUser);


module.exports = router;

// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');

// // Vérification de connexion
// router.use((req, res, next) => {
//     console.log(`[${req.method}] ${req.originalUrl}`);
//     next();
// });

// // Créer un user
// router.post('/', async (req, res) => {
//     try {
//         console.log("Données reçues:", req.body);
//         const user = new User(req.body);
//         const savedUser = await user.save();
//         res.status(201).json(savedUser);
//     } catch (error) {
//         console.error("Erreur lors de l'insertion:", error);
//         res.status(400).json({ message: error.message });
//     }
// });

// // Lire tous les users
// router.get('/', async (req, res) => {
//  try {
//  const users = await User.find();
//  console.log(users);
//  res.json(users);
//  } catch (error) {
//  res.status(500).json({ message: error.message });
//  }
// });

// // Mettre à jour un user
// router.put('/:id', async (req, res) => {
// try {
// const user = await User.findByIdAndUpdate(req.params.id,
// req.body, { new: true });
// res.json(user);
// } catch (error) {
// res.status(400).json({ message: error.message });
// }
// });
// // Supprimer un user
// router.delete('/:id', async (req, res) => {
// try {
// await User.findByIdAndDelete(req.params.id);
// res.json({ message: "User supprimé" });
// } catch (error) {
// res.status(500).json({ message: error.message });
// }
// });
// module.exports = router;