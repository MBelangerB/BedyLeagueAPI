'use strict';

const RequestManager = require('../../util/RequestManager');
const staticInfo = require('../../static/info.json');

class DiscordRestController {

    /**
     * Contact Discord API for get UserInfo
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
     * Get guilds member
     * @param {*} token_type 
     * @param {*} access_token 
     * @returns 
     */
      static async getGuilds(token_type, access_token) {
        const userInfoUrl = staticInfo.discord.routes.api;
        const headers = {
            'authorization': `${token_type} ${access_token}`,
        }

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
}

module.exports = {
    DiscordRestController,
};