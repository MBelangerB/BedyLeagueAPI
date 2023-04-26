import { IChampionMasteryDTO } from 'bedyriot';
// import { IChampion } from '../models/dragon/IChampion';
// import { ChampionInfoExt } from '../models/riot/ChampionInfo';
// import mastery, { ChampionMastery, ChampionMasteries } from '../models/riot/ChampionMastery';
import { RiotSummoner } from '../models/riot/RiotSummoner';

export class BedyMapper {

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    static MapToRiotSummoner(summonerInfo: any, isDB = false): RiotSummoner {
        const summoner: RiotSummoner = new RiotSummoner();
        if (!isDB) {
            summoner.id = summonerInfo.id;
            summoner.accountId = summonerInfo.accountId;
            summoner.puuid = summonerInfo.puuid;
            summoner.name = summonerInfo.name;
            summoner.profileIconId = summonerInfo.profileIconId;
            summoner.revisionDate = summonerInfo.revisionDate;
            summoner.summonerLevel = summonerInfo.summonerLevel;
        } else {
            summoner.dbId = summonerInfo.id;
            summoner.id = summonerInfo.riotId;
            summoner.accountId = summonerInfo.riotAccountId;
            summoner.puuid = summonerInfo.riotPuuid;
            summoner.name = summonerInfo.riotSummonerName;
            summoner.profileIconId = summonerInfo.riotProfileIconId;
            summoner.summonerLevel = summonerInfo.riotSummonerLevel;
            summoner.expiredKey = summonerInfo.expiredKey;
            summoner.revisionDate = summonerInfo.updateAt;
        }

        return summoner;
    }

    // static async MapChampionMasteryToMasteries(championMastery: Array<IChampionMasteryDTO>): Promise<ChampionMasteries> {
    //     const summonerMasteries: ChampionMasteries = new ChampionMasteries();
    //     // TODO: rmove forEach 
    //     await championMastery.reduce(async (previousMasteries, masteries) => {
    //         await previousMasteries;

    //         let tmpMastery: ChampionMastery = masteries;

    //         await mastery.getChampionDetailsByChampionId(masteries.championId).then(res => {
    //             if (res != null) {
    //                 tmpMastery.champion = res;
    //             }
    //             summonerMasteries.championMastery.push(tmpMastery);
    //         });

    //     }, Promise.resolve());

    //     summonerMasteries.championMastery.sort(function (a, b) {
    //         // Inverted ( < = -1 | > 1 )
    //         if (a.championPoints < b.championPoints) {
    //             return 1;
    //         }
    //         if (a.championPoints > b.championPoints) {
    //             return -1;
    //         }
    //         // return 0;
    //         return a.champion!.name!.localeCompare(b.champion!.name!);
    //     });

    //     return summonerMasteries;
    // }

    // static async MapRotationToChampionInfo(championInfo: IChampionInfo): Promise<ChampionInfoExt> {
    //     let currentRotation: ChampionInfoExt = new ChampionInfoExt();
        
    //     currentRotation.freeChampionIds = championInfo.freeChampionIds;
    //     currentRotation.freeChampionIdsForNewPlayers = championInfo.freeChampionIdsForNewPlayers;
    //     currentRotation.maxNewPlayerLevel = championInfo.maxNewPlayerLevel;

    //     await currentRotation.freeChampionIds.reduce(async (lastId, championId) => {
    //         await lastId;

    //         await mastery.getChampionDetailsByChampionId(championId).then((champion: IChampion) => {
    //             currentRotation.freeChampion.push(champion);
    //         });

    //     }, Promise.resolve());

    //     await currentRotation.freeChampionIdsForNewPlayers.reduce(async (lastId, championId) => {
    //         await lastId;

    //         await mastery.getChampionDetailsByChampionId(championId).then((champion: IChampion) => {
    //             currentRotation.freeChampionForNewPlayers.push(champion);
    //         });

    //     }, Promise.resolve());

    //     currentRotation.freeChampion.sort(function (a, b) {
    //         return a.name.localeCompare(b.name);
    //     });
    //     currentRotation.freeChampionForNewPlayers.sort(function (a, b) {
    //         return a.name.localeCompare(b.name);
    //     });

    //     return currentRotation;
    // }
}