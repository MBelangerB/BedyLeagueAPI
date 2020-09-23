/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_riotaccount', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: {
          tableName: 'ba_user',
        },
        key: 'id'
      }
    },
    puuid: {
      type: DataTypes.STRING(78),
      allowNull: false
    },
    profileIconId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    accountId: {
      type: DataTypes.STRING(56),
      allowNull: false
    },
    summonerId: {
      type: DataTypes.STRING(63),
      allowNull: false
    },
    summonerName: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    summonerLevel: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    region: {
      type: DataTypes.STRING(4),
      allowNull: false
    },
    lastUpdate: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'ba_riotaccount',
    timestamps: false
  });
};
