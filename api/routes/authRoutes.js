const express = require('express');
const { register, login, getUserById, getAllUsers,updateUserRole,
    resetPassword,requestPasswordReset,  updateUser,updatePassword,deleteUser
 } = require('../controllers/authController');
const router = express.Router();
const { authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

router.get('/',authenticateToken, getUserById);
router.post('/register', register);
router.post('/login', login);
router.get('/users',  authenticateToken, authorizeRole(1),getAllUsers);
router.put('/role/:id',  authenticateToken, authorizeRole(1),updateUserRole);

//actualizar usuario
router.put('/updateUser',authenticateToken, updateUser);
router.put('/updatePassword',authenticateToken, updatePassword);
router.delete('/:id',  authenticateToken, authorizeRole(1),deleteUser);

//para mail
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;