const { Sequelize, Op } = require('sequelize'); 
const { User, Event, Participation } = require('../models');

const createParticipation = async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id; 

  try {
    const event = await validateEventExistence(eventId, res);
    if (!event) return;

    if (!validateEventDate(event, res)) return;
    if (await checkExistingParticipation(userId, eventId, res)) return;

    const participation = await Participation.create({ userId, eventId, isConfirmed: false });
    res.status(201).json({ message: 'Participación registrada exitosamente.', participation });

  } catch (error) {
    console.error('Ocurrió un error al registrar la participación:', error);
    res.status(500).json({ message: 'Ocurrió un error al registrar la participación.' });
  }
};

const confirmParticipation = async (req, res) => {
  const { id } = req.params;
  const { isConfirmed } = req.body;

  if (isConfirmed !== 0 && isConfirmed !== 1) {
    return res.status(400).json({ message: 'El dato ingresado para confirmar es erróneo.' });
  }
  try {
    const participation = await Participation.findByPk(id, {
      include: [Event]
    });
    if (!participation) {
      return res.status(404).json({ message: 'Participación no encontrada.' });
    }

    const event = participation.Event;

    // Validar la fecha del evento
    if (isConfirmed === 1 && new Date(event.date) > new Date()) {
      return res.status(400).json({ message: 'No se puede confirmar la participación en un evento que aún no ha ocurrido.' });
    }

    participation.isConfirmed = isConfirmed;
    await participation.save();

    res.status(200).json({
      message: 'Participación confirmada exitosamente.',
      participation
    });

  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al confirmar participación.' });
  }
};


const deleteParticipation = async (req, res) => {
  const { id } = req.params;

  try {
    const participation = await Participation.findByPk(id);

    if (!participation) {
      return res.status(404).json({ message: 'Participación no encontrada.' });
    }

    await participation.destroy();
    res.status(200).json({ message: 'Participación eliminada exitosamente.' });

  } catch (error) {
    console.error('Ocurrió un error al eliminar la participación:', error);
    res.status(500).json({ message: 'Ocurrió un error al eliminar la participación.' });
  }
};

const getAllParticipations = async (req, res) => {
  try {
    const participations = await Participation.findAll({
      include: [User,
        {
          model: Event,
          order: [['date', 'ASC']]
        }
      ]
    });

    res.status(200).json(participations);

  } catch (error) {
    console.error('Ocurrió un error al obtener participaciones:', error);
    res.status(500).json({ message: 'Ocurrió un error al obtener las participaciones.' });
  }
};

const getUserParticipations = async (req, res) => {
  const userId = req.user.id; 
  try {
    const participations = await Participation.findAll({
      where: { userId },
      include: [
        User, 
        {
          model: Event,
          order: [['date', 'ASC']]
        }
      ]
    });

    if (!participations || participations.length === 0) {
      return res.status(404).json({ message: 'No tienes participaciones registradas.' });
    }
    res.status(200).json(participations);
  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al obtener tus participaciones.' });
  }
};

const getProximas = async (req, res) => {
  const userId = req.user.id; 

  try {
    const participations = await Participation.findAll({
      where: {
        userId,
      },
      include: [
        {
          model: User,
          attributes: ['username', 'email'],
        },
        {
          model: Event,
          where: {
            date: { [Sequelize.Op.gte]: new Date() },
          },
          attributes: ['id', 'name', 'date', 'location'],
          order: [['date', 'ASC']],
        },
      ],
    });

    if (!participations.length) {
      return res.status(404).json({ message: 'No tienes participaciones registradas.', data: [] });
    }
    return res.status(200).json(participations);

  } catch (error) {
    return res.status(500).json({ message: 'Ocurrió un error al obtener tus participaciones.' });
  }
};

const getParticipationsByEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const participantes = await Participation.findAll({
      where: { eventId: id },
      include: [
        {
          model: User,
          attributes: ['username', 'email'],
        },
        {
          model: Event,
          attributes: ['name', 'date', 'location'],
        },
      ],
    });

    if (!participantes.length) {
      return res.status(404).json({ message: 'No hay participantes registrados para este evento.', data: [] });
    }
    return res.status(200).json(participantes);

  } catch (error) {
    return res.status(500).json({ message: 'Ocurrió un error al obtener los participantes del evento.' });
  }
};

const getCertificate = async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id

  try {
    const participation = await Participation.findByPk(id, {
      include: [
        Event, 
        User
      ]
    });

    if (!participation) {
      return res.status(404).json({ message: 'Participación no encontrada.' });
    }

    if (participation.userId !== userId) {
      return res.status(403).json({ message: 'Acceso denegado.' });
    }

    // Verificar que esté confirmada la participación
    if (participation.isConfirmed != 1) {
      return res.status(400).json({ message: 'Ocurrió un error al generar el certificado, su participación no ha sido confirmada.' });
    }

    res.status(200).json(participation);

  } catch (error) {
    res.status(500).json({ message: 'Ocurrió un error al obtener el certificado.' });
  }
};

//funciones extra
const validateEventExistence = async (eventId, res) => {
  const event = await Event.findByPk(eventId);
  if (!event) {
    res.status(404).json({ message: 'Evento no encontrado.' });
    return false;
  }
  return event;
};

const validateEventDate = (event, res) => {
  if (new Date(event.date) < new Date()) {
    res.status(400).json({ message: 'No está permitido inscribirse a un evento pasado.' });
    return false;
  }
  return true;
};

const checkExistingParticipation = async (userId, eventId, res) => {
  const existingParticipation = await Participation.findOne({
    where: { userId, eventId }
  });

  if (existingParticipation) {
    res.status(400).json({ message: 'Ya estás inscripto en este evento.' });
    return true;
  }
  return false;
};


module.exports = { createParticipation, confirmParticipation, deleteParticipation, getAllParticipations, getUserParticipations, getCertificate, getProximas, getParticipationsByEvent };
