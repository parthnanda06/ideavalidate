const express = require('express');
const router = express.Router();
const { 
    saveValidation, 
    getUserValidations, 
    deleteValidation 
} = require('../controllers/validationsController');
const auth = require('../middleware/firebaseAuth'); // Use new Firebase middleware

router.post('/', auth, saveValidation);
router.get('/', auth, getUserValidations);
router.delete('/:id', auth, deleteValidation);

module.exports = router;