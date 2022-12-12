'use strict';

const RequestManager = require('../../util/RequestManager');
const SummonerDTO = require('../../entity/riot/Summoner-v4/summonerDTO');
const staticInfo = require('../../static/info.json');

const { sequelize } = require('../../db/dbSchema');
const { RIOT_Summoner, RIOT_SummonerHistory } = sequelize.models;

const { SummonerInfo } = require('../../module/lol/summoner');

class RiotSummonerController {

    /**
     * [DB/API] Check if params summoner info exist in DB
     * If not exist, call Riot API
     * @param {*} queryParameters 
     * @returns 
     */
     static async findSummoner(queryParameters) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                let result = {
                    summoner: null,
                    summonerInfo: null,
                    region: '',
                    code: 200,
                    error: {
                        message: '',
                        stack: null
                    }
                }

                let summonerName = (queryParameters.summonername || queryParameters.summonerName);
                let region = queryParameters.region;

                try {
                    // Check if exist in DB
                    let riotSummoner = await RIOT_Summoner.findSummonerBySummonerName(summonerName, region).then(dbResult => {
                        result.summoner = dbResult;
                        return dbResult;

                    }).catch(error => {
                        throw error;
                    });

                    // If data doesn't exist, we call Riot API
                    if (!riotSummoner) {
                        await this.getSummonerInfo(result, queryParameters);
                    }
    
                    resolve(result);    
                    return;
        
                } catch (error) {
                    result.code = 400;
                    result.error.stack = error;
 
                    if (error.name === 'SequelizeUniqueConstraintError') {
                        // Sequelize error has name
                        result.error.message = 'That RIOT_Summoner already exists.';

                    } else if (error.statusCode == 404) {
                        // Riot error
                        result.code = error.statusCode;
                        if (error.statusMessage) {
                            result.error.message = `${error.statusCode} - ${error.statusMessage}`;
                        } else {
                            result.error.message = `${error.statusCode} - ${summonerName} is invalid.`;
                        }
                       
                        
                    } else {
                        result.error.message = 'A error occured in RiotSummonerController.findSummoner.';
                    } 
                    reject(result);
                    return;               
                }
           
            }, 500);
        });
    }

    /**
     * [RIOT API] : Call Riot API for get SummonerInfo
     * @param {*} queryParameters 
     */
    static async getSummonerInfo(result, queryParameters) {
        const summonerInfo = new SummonerInfo(queryParameters);
        
       return await summonerInfo.getSummonerInfo().then(async function(infoResult) {
            if (infoResult.code === 200) {
                result.summonerInfo = infoResult.data;
                result.region = queryParameters.region;

            } else if (infoResult.code === 403 || infoResult.code === 404) {
                result.code = infoResult.code;
                result.error.stack = infoResult;
                result.error.message = `The summoner ${summonerInfo?.summonerName} doesn't exist.`;  
            }
            return infoResult;

        }).catch(error => {
            if (error.code == 404) {
                throw error.err;
            } else {
                throw error;
            }
        });
    }

    /**
     * [DB] Add Riot Summoner info on DB
     * @param {*} summonerInfo 
     * @returns 
     */
    static async createOrUpdateSummoner(summonerInfo, region, dbSummoner = null) {
        try {
            let summonerDTO = new SummonerDTO();
            summonerDTO.init(summonerInfo);

          //  let dbSummoner = null;
            if (dbSummoner) {
                if (dbSummoner.riotSummonerName !== summonerDTO.name) {
                    await RIOT_SummonerHistory.addSummonerHistory(dbSummoner.id, summonerDTO.name, summonerDTO.summonerLevel);
                }

                await dbSummoner.updateSummonerInfo(summonerDTO.name, summonerDTO.summonerLevel); // , new Date()
            } else  {
                dbSummoner = await RIOT_Summoner.addSummoner(summonerDTO.id, summonerDTO.accountId, summonerDTO.puuid, 
                                                             summonerDTO.name, summonerDTO.summonerLevel, region);
            }


            return dbSummoner;
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That RIOT_Summoner already exists.', error);
            }
            return console.error('A error occured in RiotSummonerController.createSummoner.', error);
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
            const dbUser = await API_Users.findUserByExternalId(userId);
            let dbGuildPermissions = await API_GuildUserPermissions.getUserPermissionByUserId(apiGuild.id, userId);

            if (!apiGuild && !dbUser) {
                return {
                    OK: false,
                    msg: 'User or Guild doesn\'t exist'
                }
            }

            if (!dbGuildPermissions) {
                dbGuildPermissions = await API_GuildUserPermissions.addGuildUserPermission(dbUser.id, apiGuild.id, guildInfo.owner, 
                                                                                            guildInfo.permissions, guildInfo.permissions_new)

            } else if (dbGuildPermissions) {
                dbGuildPermissions.updateGuildUserPermission(guildInfo.owner, guildInfo.permissions, guildInfo.permissions_new);
            }

            return dbGuildPermissions;
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
            let dbUser = await API_Users.findUserByExternalId(userId, false);
            let apiGuildPermissions = await API_GuildUserPermissions.getAllPermissionUserByUserId(dbUser.id, true);

            if (apiGuildPermissions) {
                // Return the data using the discord format.
                // {
                //     "id": "", "name": "", "icon": "",
                //     "owner": false, "permissions": 0,
                //     "features": [], "permissions_new": "0"
                // },
                const tmpData = [];

                apiGuildPermissions.forEach(guildPerm => {
                    tmpData.push({
                        id: guildPerm.API_Guild.discordGuildId,
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


}

module.exports = {
    RiotSummonerController,
};