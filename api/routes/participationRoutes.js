const express = require('express');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const { createParticipation, confirmParticipation, deleteParticipation, 
    getAllParticipations, getUserParticipations, getCertificate, getProximas,
    getParticipationsByEvent} = require('../controllers/participationController');

const router = express.Router();

// Rutas para usuario
router.post('/', authenticateToken, createParticipation);
router.delete('/:id', authenticateToken, deleteParticipation);
router.get('/', authenticateToken, getUserParticipations);
router.get('/proximas', authenticateToken, getProximas);

// Rutas protegidas para administradores
router.put('/confirm/:id', authenticateToken, authorizeRole(1), confirmParticipation); 
router.get('/all', authenticateToken,authorizeRole(1), getAllParticipations);
router.get('/events/:id', authenticateToken,authorizeRole(1), getParticipationsByEvent);

//Certificados
router.get('/certificate/:id', authenticateToken, getCertificate);

module.exports = router;