const { Event } = require('../models');
const { Sequelize } = require('sequelize');

const getEventById = async (req, res) => {
  const { id } = req.params;
  try {
    const event = await findEventById(id);
    if (!event) {
      return res.status(404).json({ message: 'Error, evento no encontrado.' });
    }
    res.json(event); 
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el evento.', error });
  }
};

// Obtener todos los eventos próximos (fecha >= hoy)
const getProxEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      where: {
        date: {
          [Sequelize.Op.gte]: new Date().toISOString() 
        }
      },
      order: [['date', 'ASC']]
    });

    res.json(events);
  } catch (error) {
    console.error('Ocurrió un error al obtener los próximos eventos:', error);
    res.status(500).json({ message: 'Ocurrió un error al obtener los próximos eventos.', error: error.message || error });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      order: [['date', 'ASC']]
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al obtener la lista de eventos.', error });
  }
};


//-------------CRUD --------------------------------------------------

const createEvent = async (req, res) => {
  const { name, date, location, description } = req.body;

  // Verificar que la fecha del evento sea mayor o igual a la fecha actual
  if (new Date(date) < new Date()) {
    return res.status(400).json({ message: 'La fecha del evento debe ser mayor o igual a la fecha actual.' });
  }

  try {
    const event = await Event.create({ name, date, location, description });
    res.status(201).json({ message: 'Evento creado exitosamente.', event });
  } catch (error) {
    res.status(400).json({ message: 'Ocurrió un error al crear el evento.', error });
  }
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, date, location, description } = req.body;

  try {
    const event = await findEventById(id);  // Reutilizo la función findEventById
    if (!event) return res.status(404).json({ message: 'Evento no encontrado.' });

    await event.update({ name, date, location, description });
    res.json({ message: 'Evento modificado exitosamente', event });
  } catch (error) {
    res.status(400).json({ message: 'Ocurrió un error al modificar el evento.', error });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await findEventById(id);  // función findEventById
    if (!event) return res.status(404).json({ message: 'Evento no encontrado.' });

    await event.destroy();
    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al eliminar el evento.', error });
  }
};

// Función auxiliar para verificar si un evento existe
const findEventById = async (id) => {
  try {
    const event = await Event.findByPk(id);
    return event;
  } catch (error) {
    throw new Error('Ocurrió un error al verificar si el evento existe.');
  }
};

module.exports = { getEventById, getProxEvents, getAllEvents, createEvent, updateEvent, deleteEvent };