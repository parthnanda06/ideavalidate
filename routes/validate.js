const express = require('express');
const router = express.Router();
const { validateIdea } = require('../controllers/validateController');

router.post('/', validateIdea);

module.exports = router;