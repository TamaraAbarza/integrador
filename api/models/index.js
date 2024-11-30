const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
    }
);

const User = require('./user')(sequelize);
const Event = require('./event')(sequelize);
const Participation = require('./participation')(sequelize);

// Relación entre User y Participation con eliminación en cascada
User.hasMany(Participation, { foreignKey: 'userId', onDelete: 'CASCADE' });
Participation.belongsTo(User, { foreignKey: 'userId' });

// Relación entre Event y Participation con eliminación en cascada
Event.hasMany(Participation, { foreignKey: 'eventId', onDelete: 'CASCADE' });
Participation.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = { sequelize, User, Event, Participation };