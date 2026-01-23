const express = require('express');
const router = express.Router();
const { validateIdea, trainModel } = require('../controllers/validateController');

router.post('/', validateIdea);
router.post('/train', trainModel);

module.exports = router;