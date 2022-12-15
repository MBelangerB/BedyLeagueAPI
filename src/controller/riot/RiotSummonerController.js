'use strict';

const SummonerDTO = require('../../entity/riot/Summoner-v4/summonerDTO');

const { sequelize } = require('../../db/dbSchema');
const { RIOT_Summoner, RIOT_SummonerHistory } = sequelize.models;

const culture = (process.env.culture || 'fr');

const moment = require('moment');
moment.locale(culture);


const { SummonerInfo } = require('../../module/lol/summoner');

class RiotSummonerController {

    static async findSummoner(queryParameters) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {

                await this.buildOrLoadSummoner(queryParameters).then(async success => {
                    let data;

                    if (success && success.code == 200 && success.summonerInfo) {
                        // Call Riot API for get SummonerInfo and create SummonerInfo in DB
                        data = await this.createOrUpdateSummoner(success.summonerInfo, success.params.region, null);

                    } else if (success && success.code == 200 && success.summoner) {

                        const lastUpdate = moment(success.summoner.updateAt);
                        if (moment().diff(lastUpdate, 'hours') >= 12) {
                            // Update
                            let updatedResult = await this.getSummonerInfo(success, queryParameters).then(summonerInfo => {
                                return summonerInfo.data;
                            }).catch(err => {
                                throw err;
                            });
                            data = await this.createOrUpdateSummoner(updatedResult, success.params.region, success.summoner);
                        } else {
                            data = success.summoner;
                        }
                    }

                    resolve(data);
                    return;

                }).catch(ex => {
                    reject(ex);
                    return;
                });

            }, 500);
        });
    }

    /**
     * [DB/API] Check if params summoner info exist in DB
     * If not exist, call Riot API
     * @param {*} queryParameters 
     * @returns 
     */
    static async buildOrLoadSummoner(queryParameters) {
        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                /**
                 * Summoner : DB Summoner
                 * summonerInfo : Riot Summoner
                 */
                let result = {
                    summoner: null,
                    summonerInfo: null,
                    code: 200,
                    error: {
                        message: '',
                        stack: null,
                    },
                    params: {
                        summonerName: (queryParameters.summonername || queryParameters.summonerName),
                        json: ((queryParameters.json === 1) || (queryParameters.json === true)),
                        region: queryParameters.region,
                    }
                }

                try {
                    // Check if exist in DB
                    let riotSummoner = await RIOT_Summoner.findSummonerBySummonerName(result.params.summonerName, result.params.region).then(dbResult => {
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
                            result.error.message = `${error.statusCode} - ${result.params.summonerName} is invalid.`;
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

        return await summonerInfo.getSummonerInfo().then(async function (infoResult) {
            if (infoResult.code === 200) {
                result.summonerInfo = infoResult.data;

            } else if (infoResult.code === 403 || infoResult.code === 404) {
                result.code = infoResult.code;
                result.error.stack = infoResult;
                result.error.message = `The summoner ${result.params.summonerName} doesn't exist.`;
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

            // Check if RiotID exist, occured if a summoner change his SummonerName
            let tmpSummoner = await RIOT_Summoner.findSummonerByRiotId(summonerDTO.id);
            if (tmpSummoner) {
                // We need update data
                dbSummoner = tmpSummoner;
            }

            if (dbSummoner) {
                // If summonerName has change
                if (dbSummoner.riotSummonerName !== summonerDTO.name) {
                    await RIOT_SummonerHistory.addSummonerHistory(dbSummoner.id, dbSummoner.riotSummonerName, dbSummoner.summonerLevel);
                }

                await dbSummoner.updateSummonerInfo(summonerDTO.name, summonerDTO.summonerLevel, summonerDTO.profileIconId);
            } else {
                dbSummoner = await RIOT_Summoner.addSummoner(summonerDTO.id, summonerDTO.accountId, summonerDTO.puuid,
                    summonerDTO.name, summonerDTO.summonerLevel, summonerDTO.profileIconId, region);
            }

            return dbSummoner;

        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return console.error('That RIOT_Summoner already exists.', error);
            }
            return console.error('A error occured in RiotSummonerController.createOrUpdateSummoner.', error);
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
 


}

module.exports = {
    RiotSummonerController,
};