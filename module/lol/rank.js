var routeInfo = require('../../static/info.json');
var RequestManager = require(`../../util/RequestManager`);

const CacheService = require('../Cache.Service');
const path = require('path');

const LeagueEntryDTO = require('../../entity/riot/League-v4/leagueEntryDTO');

/*
    Cache configuration
    const ttl = 60 * 60 * 1; // cache for 1 Hour
*/
var rankDelay = 60 * 2; // cache for 2 min
var rankCache = new CacheService(rankDelay); // Create a new cache service instance

module.exports = class LeagueEntry {

    constructor(params, url) {
        // Paramètre obligatoire
        this.encryptedSummonerId = params.summoner.id;
        this.summonerDTO = params.summoner;
        this.region = params.region;
        this.url = url;

        // Paramètre facultatif
        this.getJson = ((params.json === 1) || (params.json === true));
        this.getAll = ((params.all === 1) || (params.all === true));

        this.showLp = ((params.lp === 1) || (params.lp === true));
        this.fullString = ((params.fullstring === 1) || (params.fullstring === true));
        this.showWinRate = ((params.winrate === 1) || (params.winrate === true));
        this.showType = ((params.type === 1) || (params.type === true));
        this.fullqueue = ((params.fq === 1) || (params.fq === true));

        this.series = params.series;
        this.queueType = params.queuetype;

        this.gameType = RequestManager.TokenType.LOL;
        if (this.queueType.toLowerCase() === "tft") {
            this.gameType = RequestManager.TokenType.TFT;
        }

    }

    getCacheKey() {
        return `LeagueEntry-${this.summonerDTO.name}-${this.region}-${this.queueType}`
    }
    getUrlBySummonerName(encryptedSummonerId, region, queueType) {
        if (!encryptedSummonerId) { encryptedSummonerId = this.encryptedSummonerId; }
        if (!region) { region = this.region; }
        if (!queueType) { queueType = this.queueType; }


        let baseUrl = routeInfo.lol.routes.league.v4.getLeagueEntriesForSummoner;
        if (queueType === "tft") {
            baseUrl = routeInfo.lol.routes.tft_league.v1.getTFTLeagueEntriesForSummoner;
        }
        baseUrl = baseUrl.replace("{encryptedSummonerId}", encryptedSummonerId);
        baseUrl = baseUrl.replace("{region}", region);

        return baseUrl;
    }

    /**
     * Step 1 : Execution de la Query qui obtient les LeagueEntryDTO.
     */
    async _queryRankData(requestManager, result) {
        // Le SummonerInfo n'est pas présent dans la cache
        var data = await requestManager.ExecuteTokenRequest(this.getUrlBySummonerName(), this.gameType).then(function (LeagueEntryDTO) {
            return LeagueEntryDTO;
        }, function (error) {
            if (error.response) {
                result.err = {
                    statusCode: error.response.status,
                    statusMessage: error.response.statusText,
                    stack: error.stack
                }
            } else {
                result.err = {
                    statusCode: 404,
                    statusMessage: error.message,
                    stack: error.stack
                }
            }

            return result;
        });
        return data;
    };

    /**
     * Méthode principale
     */
    async getLeagueRank() {
        var result = {
            "code": 0,
            "err": {}
        };
        var key = this.getCacheKey();
        var self = this;

        return new Promise(async function (resolve, reject) {
            try {

                await rankCache.getAsyncB(key).then(async function (resultData) {
                    // Vérifie si les données sont déjà en cache, si OUI on utilise la cache
                    if (typeof resultData === "undefined") {
                        var data = await self._queryRankData(RequestManager, result);
                        if (data) {
                            rankCache.setCacheValue(key, data);
                            return data;
                        } else {
                            reject(result);
                            return;
                        }
                    } else {
                        // L'information est présente dans la cache
                        return resultData;
                    }
                }).then(async resultQry => {
                    // On traite le Resut
                    var entries = [];
                    if (resultQry && typeof resultQry.err === "undefined") {
                        // On converti le data
                        resultQry.forEach(function (data) {
                            var leagueEntryDTO = new LeagueEntryDTO(data);
                            entries.push(leagueEntryDTO);
                        });
                        self.leagueEntries = entries;

                        result.code = 200;

                    } else if (resultQry && typeof resultQry.err != "undefined" && resultQry.err.statusCode === "200-1") {
                        // Erreur normal (pas classé, invocateur n'Existe pas)
                        result.code = 201;

                    } else {
                        result.code = 404;
                    }
                });
                resolve(result);
                return;

            } catch (ex) {
                console.error(ex);

                result.code = -1;
                result.err.statusMessage = ex;

                reject(result);
                return;
            }
        });
    }

    static getMappingQueueTypeToLeagueQueue() {
        return {
            'solo5': 'RANKED_SOLO_5x5',
            'solo': 'RANKED_SOLO_5x5',
            'soloq': 'RANKED_SOLO_5x5',
            'flex': 'RANKED_FLEX_SR',
            'flex5': 'RANKED_FLEX_SR',
            'tft': 'RANKED_TFT'
        };
    }
    static getMappingRegionToLeagueQueue() {
        return {
            'EUW': 'EUW1',
            'EUW1': 'EUW1',
            'NA': 'NA1',
            'NA1': 'NA1',
            'EUNE': 'EUN1',
            'EUN1': 'EUN1'
        };
    }

    async getJsonData(entries, isOverlay = false) {
        // Convertir le JSON en Array
        // var iconEntries = Object.entries(profileIconDta.data);

        // // Recherche la correspondance
        // var fullIconDta = iconEntries.find(f => f[1].id === summoner.profileIconId);
        // var iconUrl = '';
        // if (fullIconDta) {
        //     // TODO: Remlacer version
        //     var fullIconId = fullIconDta[1].image.full;
        //     iconUrl = `http://ddragon.leagueoflegends.com/cdn/10.8.1/img/profileicon/${fullIconId}`;
        // }
        //  "profileIconUrl": iconUrl,
        var mappingQueue = LeagueEntry.getMappingQueueTypeToLeagueQueue();

        // Préparer le retour
        var data = {
            "summoner": {
                "name": this.summonerDTO.name,
                "profileIcon": this.summonerDTO.profileIconId,
                "profileIconUrl": "",
                "level": this.summonerDTO.summonerLevel
            },
            "region": this.region,
            "queues": []
        }


        entries.forEach(n => {
            var tier = {
                "RiotQueueType": n.queueType,
                "QueueType": Object.entries(mappingQueue).find(q => q[1] === n.queueType)[0], // queueEntrier.find(q => q[1] === n.queueType),
                "tiers": n.tier,
                "rank": n.rank,
                "series": n.getSeries(this.series, isOverlay),
                "LP": n.getLeaguePoint(true),
                "stats": {
                    "ratio": n.getRatio(),
                    "W": n.wins,
                    "L": n.losses
                }
            }

            data.queues.push(tier);
        });

        return data;
    }

    async getTextData(entries, queue, all, withName) {
        //  var entries = this.leagueEntries;
        var mappingQueue = LeagueEntry.getMappingQueueTypeToLeagueQueue();
        var returnValue = '';

        if (all) {
            var soloQ = await this.getTextData(entries, "solo5", false, true);
            var flex = await this.getTextData(entries, "flex", false, (soloQ.length === 0));

            returnValue = `${soloQ} / ${flex}`;
        } else {

            var league = entries.find(entry => entry.queueType === mappingQueue[queue]);

            if (league) {
                var rankTiers = league.getTiersRank();
                var leaguePt = '';
                var winRate = '';
                var series = league.getSeries(this.series);
                var gameType = '';

                if (this.showLp) {
                    leaguePt = league.getLeaguePoint();
                }

                if (this.showWinRate) {
                    winRate = ` - ${league.getRatio()} % (${league.wins}W/${league.losses}L)`;
                }

                if (this.showType) {
                    if (this.fullqueue && league.getGameType() === "SoloQ") {
                        gameType = ` (SoloQ/DuoQ)`;
                    } else {
                        gameType = ` (${league.getGameType()})`;
                    }
                }

                if ((this.fullString && withName) || (this.fullString && (typeof withName !== "undefined" && withName))) {
                    let CapSummonerName = `${this.summonerDTO.name}`;
                    CapSummonerName = CapSummonerName.charAt(0).toUpperCase() + CapSummonerName.slice(1);

                    returnValue = `${CapSummonerName} est actuellement ${rankTiers}${leaguePt}${series}${winRate}${gameType}`;
                } else {
                    returnValue = `${rankTiers}${leaguePt}${series}${winRate}${gameType}`;
                }
            }
            else {
                if ((this.fullString && withName) || (this.fullString && (typeof withName !== "undefined" && withName))) {
                    let CapSummonerName = `${this.summonerDTO.name}`;
                    CapSummonerName = CapSummonerName.charAt(0).toUpperCase() + CapSummonerName.slice(1);

                    returnValue = `${CapSummonerName} est actuellement Unranked.`;
                } else {
                    returnValue = `unranked`;
                }           
            }
        }
        return returnValue;
    }

    async getReturnValue() {
        var returnValue = '';
        let entries = this.leagueEntries;
        let jsonReturn = this.getJson;
        let getAll = this.getAll;
        let queue = this.queueType;
        let self = this;

        try {
            return new Promise(async function (resolve, reject) {
                if (jsonReturn) {
                    returnValue = (self.getJsonData(entries));
                } else {
                    returnValue = (self.getTextData(entries, queue, getAll, true));
                }
                resolve(returnValue)
            });
        } catch (ex) {
            console.error(ex);
        }
    }

    async getOverlayData(mode) {
        var returnValue = {
            mode: parseInt(mode),
            summoner: {
                name: "",
                level: 0
            },
            queue: this.queueType,
            stats: {
                ratio: "",
                wins: 0,
                looses: 0,
                series: {
                    enabled: 0,
                    result: ''
                }
            },      
            rank: {
                colorRank: "",
                tier: "",
                lp: 0,
                rank: "",
            },
            image: {
                src: "",
                alt: ""
            }
        };

        let entries = this.leagueEntries;
        let queue = this.queueType;
        let self = this;
        let data;

        try {
            return new Promise(async function (resolve, reject) {
                data = await self.getJsonData(entries, true);
                let userQueue = data.queues.find(q => q.QueueType === queue);

                returnValue.summoner.name = data.summoner.name;
                returnValue.summoner.level = data.summoner.level;

                returnValue.stats.ratio = userQueue.stats.ratio;
                returnValue.stats.wins = userQueue.stats.W;
                returnValue.stats.looses = userQueue.stats.L;

                returnValue.stats.series.enabled = false;
                if (userQueue.series) {
                    returnValue.stats.series.enabled = true;
                    returnValue.stats.series.result = userQueue.series;
                }

                returnValue.rank.tier = userQueue.tiers;
                returnValue.rank.lp = userQueue.LP;
                returnValue.rank.rank = userQueue.rank;
                returnValue.rank.colorRank = userQueue.tiers.toLowerCase();

                returnValue.image.alt = `${userQueue.tiers} ${userQueue.rank}`;
                returnValue.image.src = `${LeagueEntry.getEmbles(userQueue.tiers)}`

                console.log(returnValue);

                resolve(returnValue)
            });
        } catch (ex) {
            console.error(ex);
        }
    }

    static getEmbles(tiers) {
        var folder = `/emblems`;
        var imgName;

        switch (tiers.toUpperCase()) {
            case 'IRON':
                imgName = `/Emblem_Iron.png`
                break;

            case 'BRONZE':
                imgName = `/Emblem_Bronze.png`
                break;

            case 'SILVER':
                imgName = `/Emblem_Silver.png`
                break;

            case 'GOLD':
                imgName = `/Emblem_Gold.png`
                break;

            case 'PLATINUM':
                imgName = `/Emblem_Platinum.png`
                break;

            case 'DIAMOND':
                imgName = `/Emblem_Diamond.png`
                break;

            case 'MASTER':
                imgName = `/Emblem_Master.png`
                break;

            case 'GRANDMASTER':
                imgName = `/Emblem_GrandMaster.png`
                break;

            case 'CHALLENGER':
                imgName = `/Emblem_Challenger.png`
                break;
        }

        return path.join(folder, imgName);
    }



}

