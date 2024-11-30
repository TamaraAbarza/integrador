const express = require('express');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const { getEventById, getProxEvents, getAllEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');

const router = express.Router();

// Rutas para usuarios
router.get('/',authenticateToken, getAllEvents);
router.get('/proximos', authenticateToken, getProxEvents);
router.get('/:id',authenticateToken, getEventById);

// Rutas protegidas para administradores
router.post('/', authenticateToken, authorizeRole(1), createEvent);
router.put('/:id', authenticateToken, authorizeRole(1), updateEvent);
router.delete('/:id', authenticateToken, authorizeRole(1), deleteEvent);

module.exports = router;