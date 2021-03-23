const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.protect, viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);

// login
router.get('/login', viewsController.getLoginForm);

module.exports = router;
