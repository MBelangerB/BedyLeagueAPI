// import { IChampionInfo } from "bedyriot";
// import { DragonCulture } from "src/declarations/enum";
// // import { DragonService } from "src/services/dragon-service";
// import { IChampion } from "../dragon/IChampion";

// // ***** Interface ***** //
// // export interface IChampionInfo {
// //     maxNewPlayerLevel: number,
// //     freeChampionIdsForNewPlayers: Array<number>,
// //     freeChampionIds: Array<number>,
// // }

// export interface IChampionInfoExt extends IChampionInfo {
//     freeChampionForNewPlayers: Array<IChampion>;
//     freeChampion: Array<IChampion>;

//     getFreeChampionStr() : string;
//     getNewbiesFreeChampionStr() : string;
// }

// // ***** Classes ***** //
// export class ChampionInfoExt implements IChampionInfoExt {
//     // IChampionInfo
//     maxNewPlayerLevel: number = 0;
//     freeChampionIdsForNewPlayers: number[] = [];
//     freeChampionIds: number[] = [];

//     // IChampionInfoExt
//     freeChampionForNewPlayers: IChampion[] = [];
//     freeChampion: IChampion[] = [];

//     getFreeChampionStr() : string {
//         let returnValue = '';

//         this.freeChampion.forEach(function (champ) {
//             if (returnValue.length > 0) { returnValue += ' | '; }
//             returnValue += champ.name;
//         });

//         returnValue = returnValue.trimEnd();

//         return returnValue;
//     }

//     getNewbiesFreeChampionStr() : string {
//         let returnValue = '';

//         this.freeChampionForNewPlayers.forEach(function (champ) {
//             if (returnValue.length > 0) { returnValue += ' | '; }
//             returnValue += champ.name;
//         });

//         returnValue = returnValue.trimEnd();

//         return returnValue;
//     }
// }


// // /**
// //  * Check if summoner is on DB
// //  * @param summonerName 
// //  * @param region 
// //  * @returns 
// //  */
// //  async function getRotatationByChampionId(championId: number, culture: DragonCulture = DragonCulture.fr_fr): Promise<IChampion> {
// //     // Get Summoner on DB
// //     // TODO: Cache for DragonService
// //     const dragonChampionData: Array<IChampion> = await DragonService.readDragonChampionFile(culture);
// //     const dragonChamp = dragonChampionData.find(e => e.id === championId.toString());

// //     let returnValue : IChampion;
// //     if (dragonChamp) {
// //         returnValue = dragonChamp;
// //     }
// //     return returnValue!;
// // }

// // export default {
// //     getRotatationByChampionId,
// // };

