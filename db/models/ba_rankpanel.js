/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_rankpanel', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    riotAccountId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: {
          tableName: 'ba_riotaccount',
        },
        key: 'id'
      }
    },
    queueType: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    gameType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    panelToken: {
      type: DataTypes.STRING(56),
      allowNull: false
    },
    panelEnabled: {
      type: DataTypes.INTEGER(4),
      allowNull: false
    },
    panelInfo: {
      type: 'LONGTEXT',
      allowNull: false,
      comment: ''
    },
    lastUtilizationDate: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'ba_rankpanel',
    timestamps: false
  });
};
