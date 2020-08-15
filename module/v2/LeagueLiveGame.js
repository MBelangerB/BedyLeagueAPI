
var info = require('../../static/info.json');
var champions = require('../../dragon/fr_fr/champion.json');

var champInfo = require(`../../class/v1/Champions/ChampionInfo`);
var SummonerDTO = require('../../class/v2/SummonerDTO');
var ChampionMasteryDTO = require('../../class/v2/ChampionMasteryDTO');
var ParticipantsGame = require('../../class/v2/ParticipantsGame');

var RequestManager = require(`./RequestManager`);
const CacheService = require('../Cache.Service');

/*
    Cache configuration
*/
var ttSummonerInfo = 60 * 60 * 1 * 24; // cache for 1 Hour
var ttLeagueInfo = 60 * 5; // cache for 1 mn (60 sec * 1 min)

var summonerCache = new CacheService(ttSummonerInfo); // Create a new cache service instance
var leagueCache = new CacheService(ttLeagueInfo); // Create a new cache service instance


module.exports = class LeagueLiveGame {
    constructor(queryString) {
        this.loadChampionInfo();

        // Prepare Query
        for (var key in queryString) {
            queryString[key.toLowerCase()] = queryString[key];
        }
        // Paramètre obligatoire
        this.summonerName = queryString.summonername;
        this.region = queryString.region;
    }

    loadChampionInfo() {
        var champArr = [];
        for (var myKey in champions.data) {
            var champName = champions.data[myKey].name;
            var chamId = champions.data[myKey].key;

            var rotChamp = new champInfo();
            rotChamp.init(chamId, champName);

            champArr.push(rotChamp);
        }
        if (champArr && champArr.length > 0) {
            this.championList = champArr;
        }
    }

    getSummonerCacheKey() {
        return `${this.summonerName}-${this.region}`;
    }
    getLiveCacheKey() {
        return `LiveGame-${this.summonerName}-${this.region}`
    }


    // Step 1 : Execution de la Query qui obtient les informations sur l'invocateur
    async querySummonerInfo(requestManager, result) {
        var data;
        var SummonerUrl = info.routes.v2.summoner.getBySummonerName.replace('{region}', this.region).replace('{summonerName}', this.summonerName);

        // Le SummonerInfo n'est pas présent dans la cache
        await requestManager.ExecuteRequest(SummonerUrl).then(function (res) {
            data = res;
        }, function (error) {
            if (typeof error.status !== "undefined" && error.status.status_code === 404) {
                if (error.status.message === "Data not found - summoner not found") {
                    // UseCase : Invocateur n'existe pas.
                    result.err = {
                        statusCode: '200-1',
                        statusMessage: "L'invocateur n'existe pas."
                    }
                } else {
                    result.err = {
                        statusCode: err.status.status_code,
                        statusMessage: error.status.message
                    }
                }
            } else {
                // error.code = 'ENOTFOUND'     -> mauvais serveur
                result.err = {
                    statusCode: '',
                    statusMessage: error.statusMessage
                }
            }
        });
        return data;
    }
    // Step 2 : Execution de la Query qui obtient les informations sur la ActiveGame
    async queryActiveGame(requestManager, result, summonerId) {
        var data;
        var leagueUrl = info.routes.v2.liveGame.getCurrentGameInfoBySummoner.replace('{region}', this.region).replace('{encryptedSummonerId}', summonerId);
        var summon = `${this.summonerName}`;

        await requestManager.ExecuteRequest(leagueUrl).then(function (res) {
            data = res;
        }, function (error) {
            if (error.status.status_code === 404 && error.status.message == "Data not found") {
                result.err = {
                    statusCode: '200-1',
                    statusMessage: `${summon} n'est actuellement pas en jeu.`
                }

            } else if (typeof error.message === "undefined") {
                result.err = {
                    statusCode: error.statusCode,
                    statusMessage: error.statusMessage
                }
            } else {
                result.err = {
                    statusCode: '',
                    statusMessage: error.message
                }
            }
        });

        return data;
    }
    // Step 3 : Execution de la Query qui obtient l'historique des parties
    async queryGameHistory(requestManager, result, accountId, championId, queueId, seasonId) {
        var data;
        var leagueUrl = info.routes.v2.matchHistory.getMatchListByChampionAndQueue.replace('{region}', this.region);
        leagueUrl = leagueUrl.replace('{encryptedAccountId}', accountId).replace('{championId}', championId);
        leagueUrl = leagueUrl.replace('{queueId}', queueId).replace('{seasonId}', seasonId);


        await requestManager.ExecuteRequest(leagueUrl).then(function (res) {
            data = res;
        }, function (error) {
            if (error.status.status_code === 404 && error.status.message == "Data not found") {
                result.err = {
                    statusCode: '',
                    statusMessage: 'Aucune game en cours'
                }

            } else if (typeof error.message === "undefined") {
                result.err = {
                    statusCode: error.statusCode,
                    statusMessage: error.statusMessage
                }
            } else {
                result.err = {
                    statusCode: '',
                    statusMessage: error.message
                }
            }
        });

        return data;
    }


    // Obtenir le summonerInfo
    // Obtenir la partie en cours (ActiveGame)
    async getLiveGame() {
        var result = {
            "code": 0,
            "err": {}
        };
        var summonerInfo = new SummonerDTO(this);
        var requestManager = new RequestManager(this);
        var me = this;

        try {
            var key = this.getSummonerCacheKey();
            var SummonerData = await summonerCache.getAsyncB(key).then(function (sumData) {
                if (typeof sumData === "undefined") {
                    // Le data n'est pas présent on doit l'obtenir
                    var data = me.querySummonerInfo(requestManager, result);
                    // On associe le SummonerInfo dans la cache
                    summonerCache.setCacheValue(key, data);
                    return data;
                } else {
                    // L'information est présente dans la cache
                    return sumData;
                }
            });


            if (SummonerData || typeof SummonerData !== "undefined") {
                // TODO: Gérer le cas ou pas de data mais ERR
                summonerInfo.init(SummonerData);
                this.SummonerDTO = summonerInfo;

                key = this.getLiveCacheKey();

                var activeGame = await leagueCache.getAsyncB(key).then(function (sumData) {
                    if (typeof sumData === "undefined") {
                        // Le data n'est pas présent on doit l'obtenir
                        var data = me.queryActiveGame(requestManager, result, summonerInfo.getId);
                        leagueCache.setCacheValue(key, data);
                        return data;
                    } else {
                        // L'information est présente dans la cache
                        return sumData;
                    }
                });

                if (activeGame || typeof activeGame !== "undefined") {
                    this.activeGame = activeGame;
                }

            }

            // On traite le Resut
            if (result && typeof result.err.statusCode === "undefined") {
                // Aucune erreur
                result.code = 200;
            } else if (result && result.err.statusCode === "200-1") {
                // Erreur normal 
                result.code = 201;
            } else {
                result.code = 404;
            }

        } catch (ex) {
            result.code = -1;
            console.error(ex);
        }
        return result;
    }

    /*
    Obtenir Summoner
    Obtenir ActiveGame		(ChampionID, Queue)
    Obtenir MatchList par champion	(obtenir gameId)
        POur chacun obtenir Match
            Valider Team Summoner
            Valider WIN ou LOOSE
    */
    async getSummonerGamesByChampion() {
        var summoner = this.SummonerDTO;
        var data = summonerDta;
        var summonerDta = data.participants.find(e => e.summonerId === summoner.getId);

        var accountId = summoner.accountId;
        var queueId = data.gameQueueConfigId;
        var championId = summonerDta.championId;
    }

    getCurrentChampionData() {
        var summoner = this.SummonerDTO;
        var data = summonerDta;

        var summonerDta = data.participants.find(e => e.summonerId === summoner.getId);
        var summonerName = summoner.getSummonerName;

        var champion = new ChampionMasteryDTO();
        var champList = this.championList;

        var sChampion = champList.find(e => e.id === summonerDta.championId.toString());
        champion.init(sChampion, sChampion.championName);

        // Bohe joue actuellement Lux (MasteriesPts - WIN RATE ?) en utilisant Flash/Ignite
        // Bohe joue actuellement Lux (xxx pts - xx partie). Sort d'invocateur : F/D
    }

    /* 
        Retourne les informations sur la parti en cours
        Routes : livegame
    */
    getActionGameDetails() {
        var returnValue = '';
        var activeSummoner = this.summonerName;
        var gameInfo = this.activeGame;
        var champList = this.championList;

        /*
        var mapId = gameInfo.mapId;
        var gameType = gameInfo.gameType;
        var queueId = gameInfo.gameQueueConfigId;
        */
        var participants = [];

        // Parcours les participants
        gameInfo.participants.forEach(function (participant) {
            var participantGame = new ParticipantsGame;
            participantGame.init(participant.summonerId, participant.summonerName,
                participant.championId, participant.spell1Id, participant.spell2Id, participant.teamId)

            var champion = champList.find(e => e.id === participant.championId.toString());
            participantGame.setChampionName(champion.championName);

            participants.push(participantGame);
        });

        var teamRed = "";
        var teamBlue = "";

        participants.forEach(function (participant) {
            if (participant.teamId === 100) {
                if (teamRed.length > 0) { teamRed += " | "; }

                /*
                if (activeSummoner === participant.summonerName) {
                    teamRed += '🎮';
                }
                */

                teamRed += `${participant.summonerName} (${participant.championName})`;

            } else if (participant.teamId === 200) {
                if (teamBlue.length > 0) { teamBlue += " | "; }
                /*
                if (activeSummoner === participant.summonerName) {
                    teamBlue += '🎮';
                }
                */

                teamBlue += `${participant.summonerName} (${participant.championName})`;
            }
        });

        returnValue = `🔴${teamRed} Vs 🔵${teamBlue}`;

        /*
            🔴🔵
            🔹🎮✔️

            🔴 Bohe (Lux) / Palo (Cait) / X1 (Y1) / X2 (Y2) / X3 (Y3)
            Vs
            🔵 X1 (Y1) / X2 (Y2) / X3 (Y3) / X4 (Y4) / X5 (Y5)
        */


        returnValue = returnValue.trimEnd();
        return returnValue.trim();
    }

}