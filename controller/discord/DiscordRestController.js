'use strict';

const RequestManager = require('../../util/RequestManager');
const staticInfo = require('../../static/info.json');

const { sequelize } = require('../../db/dbSchema');
const { API_Guilds, API_Users, API_GuildUserPermissions, BOT_Guilds } = sequelize.models;

class DiscordRestController {

    /**
     * [REST] Contact Discord API for get UserInfo
     * @param {*} token_type 
     * @param {*} access_token 
     * @returns 
     */
    static async getDiscordUserInfo(token_type, access_token) {
        const userInfoUrl = staticInfo.discord.routes.api;
        const headers = {
            'authorization': `${token_type} ${access_token}`,
        }

        return await RequestManager.ExecuteRequest(userInfoUrl + staticInfo.discord.routes.user.currentUser, headers, null, 'get').then(function (userinfo) {
            const result = {
                OK: true,
                data: userinfo
            }
            return result;

        }, function (error) {
            const result = {
                code: error.error,
                msg: error.error_description,
                OK: false,
            };
            return result;
        });
    }

    /**
    * [REST] Contact Discord API for get guilds member
    * @param {*} token_type 
    * @param {*} access_token 
    * @returns 
    */
    static async getGuilds(token_type, access_token) {
        const userInfoUrl = staticInfo.discord.routes.api;
        const headers = {
            'authorization': `${token_type} ${access_token}`,
        }

        // {
        //     "id": "",
        //     "name": "",
        //     "icon": "",
        //     "owner": false,
        //     "permissions": 104320577,
        //     "features": [],
        //     "permissions_new": "1071698660929"
        // },
        return await RequestManager.ExecuteRequest(userInfoUrl + staticInfo.discord.routes.user.userGuild, headers, null, 'get').then(function (guilds) {
            const result = {
                OK: true,
                data: guilds
            }
            return result;

        }, function (error) {
            const result = {
                code: error.error,
                msg: error.error_description,
                OK: false,
            };
            return result;
        });
    }

    /**
     * [DB] Persist Guild in database
     * @param {*} guild 
     * @returns 
     */
    static async createOrLoadGuild(guildInfo, updateData = false) {
        try {
            let apiGuild = await API_Guilds.getApiGuildByGuildId(guildInfo.id);

            if (!apiGuild) {
                apiGuild = await API_Guilds.create({
                    guildId: guildInfo.id,
                    name: guildInfo.name,
                    icon: guildInfo.icon,
                });

            } else if (apiGuild && updateData) {
                apiGuild.set({
                    name: guildInfo.name,
                    icon: guildInfo.icon,
                });
                await apiGuild.save();
            }

            return apiGuild;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That API Guilds already exists.', error);
            }
            return console.error('A error occured in DiscordRestController.persistGuildInDb.', error);
        }
    }

    /**
     * [DB] Persist permission in DB
     * @param {*} guildInfo 
     * @param {*} apiGuild 
     * @param {*} userId 
     * @returns 
     */
    static async persistGuildPermission(guildInfo, apiGuild, userId) {
        try {
            const apiUser = await API_Users.getApiUserByExternalId(userId);
            let apiGuildPermissions = await API_GuildUserPermissions.getUserPermissionByUserId(apiGuild.id, userId);

            if (!apiGuild && !apiUser) {
                return {
                    OK: false,
                    msg: 'User or Guild doesn\'t exist'
                }
            }

            if (!apiGuildPermissions) {
                apiGuildPermissions = await API_GuildUserPermissions.create({
                    userId: userId,
                    guildId: apiGuild.guildId,
                    permissions: guildInfo.permissions,
                    permissionsNew: guildInfo.permissions_new,
                    isOwner: guildInfo.owner,
                });

            } else if (apiGuildPermissions) {
                apiGuildPermissions.set({
                    permissions: guildInfo.permissions,
                    permissionsNew: guildInfo.permissions_new,
                    isOwner: guildInfo.owner,
                    ts: Date.now()
                });
                await apiGuildPermissions.save();
            }

            return apiGuildPermissions;

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That Guild User Permissions already exists.', error);
            }
            return console.error('A error occured in DiscordRestController.persistGuildPermission.', error);
        }
    }



    /**
     * [DB] Load Guild Permission in database
     * @param {*} guild 
     * @returns 
     */
    static async loadGuilds(userId) {
        try {
            let apiGuildPermissions = await API_GuildUserPermissions.getAllPermissionUserByUserId(userId, true);

            if (apiGuildPermissions) {
                // Return Data with discord format
                // {
                //     "id": "",
                //     "name": "",
                //     "icon": "",
                //     "owner": false,
                //     "permissions": 104320577,
                //     "features": [],
                //     "permissions_new": "1071698660929"
                // },
                const tmpData = [];
                apiGuildPermissions.forEach(guildPerm => {
                    tmpData.push({
                        id: guildPerm.API_Guild.guildId,
                        name: guildPerm.API_Guild.name,
                        icon: guildPerm.API_Guild.icon,
                        owner: guildPerm.isOwner,
                        permissions: guildPerm.permissions,
                        permissions_new: guildPerm.permissionsNew,
                    });
                });
                return tmpData;
            }

        } catch (error) {
            return console.error('A error occured in DiscordRestController.loadGuildsUser.', error);
        }
    }

    /**
     * [DB] Load bot Guild in database
     * @returns 
     */
    static async loadBotGuild() {
        try {
            let guilds = await BOT_Guilds.getAllActiveGuilds(false);

            if (guilds) {
                const tmpData = [];
                guilds.forEach(guild => {
                    tmpData.push({
                        id: guild.guildId,
                        name: guild.guildName
                    });
                });
                return tmpData;
            }

        } catch (error) {
            return console.error('A error occured in DiscordRestController.loadBotGuild.', error);
        }
    }
}

module.exports = {
    DiscordRestController,
};