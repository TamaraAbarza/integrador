const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Participation', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    isConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'eventId'],
      },
    ],
  });
};