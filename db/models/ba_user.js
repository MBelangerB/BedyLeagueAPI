/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var BA_User = sequelize.define('ba_user', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    userToken: {
      type: DataTypes.STRING(56),
      allowNull: false,
      unique: true
    },
    useUserToken: {
      type: DataTypes.INTEGER(4),
      allowNull: false
    },
    createdDate: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'ba_user',
    timestamps: false
  });

  // BA_User.associate = models => {
  //   // belongsTo
  //   BA_User.hasOne(models.ba_twitchuser, {as: 'TwitchUser'});
  // };

  return BA_User;
};
