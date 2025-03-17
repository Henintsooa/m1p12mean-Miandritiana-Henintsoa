const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');

router.get('/:iduser', NotificationController.getNotificationsByUser);

module.exports = router;
