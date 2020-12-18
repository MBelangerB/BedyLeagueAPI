/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ba_usersharedaccess', {
    mainUserId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: {
          tableName: 'ba_user',
        },
        key: 'id'
      }
    },
    managerId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: {
          tableName: 'ba_user',
        },
        key: 'id'
      }
    },
    accessLevel: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'ba_usersharedaccess',
    timestamps: false
  });
};
