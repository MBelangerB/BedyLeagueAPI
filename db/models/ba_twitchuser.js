/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  var BA_TwitchUser =  sequelize.define('ba_twitchuser', {
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
    twitchId: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    loginName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    displayName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    profileImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'ba_twitchuser',
    timestamps: false,
  });

  // BA_TwitchUser.associate = models => {
  //   // belongsTo
  //   BA_TwitchUser.hasOne(models.ba_user, {as: 'user'});
  // };

  return BA_TwitchUser;
};
