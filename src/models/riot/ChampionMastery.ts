// import { IChampionMasteryDTO } from "bedyriot";
// import { IChampion } from "bedyriot/build/model/RiotModel";
// import { DragonCulture } from "../../declarations/enum";
// // import { DragonService } from "../../services/dragon-service";
// // import { IChampion } from "../dragon/IChampion";

// export interface IChampionMastery extends IChampionMasteryDTO {
//     champion?: IChampion;
//     toString(): string;
// }

// export class ChampionMastery implements IChampionMastery {
//     championId!: number;
//     summonerId!: string;

//     champion?: IChampion;

//     championLevel!: number;
//     championPoints!: number;

//     chestGranted: boolean = false;
//     championPointsUntilNextLevel!: number;
//     championPointsSinceLastLevel!: number;
//     tokensEarned!: number;
//     lastPlayTime!: number;

//     /**
//      * Get Champion name + pts
//      * @returns 
//      */
//     public toString(): string {
//         const returnValue = `${this.champion?.name} (${this.championPoints} pts)`;
//         return returnValue.trimEnd();
//     }
// }

// export class ChampionMasteries {
//     championMastery: ChampionMastery[] = [];

//     public toString(): string {
//         let returnValue: string = '';
//         this.championMastery.forEach(function (champion: ChampionMastery) {
//             if (returnValue.length > 0) { returnValue += ' | '; }

//             returnValue += `${champion.champion?.name} (${champion.championPoints} pts)`; // champion.toString();
//         });
//         return returnValue.trimEnd();
//     }
    
//     getResult(n: number) : string {
//         let returnValue: string = '';
//         for (let index = 0; index < n; index++) {
//             const element: ChampionMastery = this.championMastery[index];
//             if (returnValue.length > 0) { returnValue += ' | '; }

//             returnValue +=  `${element.champion?.name} (${element.championPoints} pts)`; // element.toString(); 
//         }
       
//         return returnValue.trimEnd();       
//     }
// }

// /**
//  * Check if summoner is on DB
//  * @param summonerName 
//  * @param region 
//  * @returns 
//  */
//  async function getChampionDetailsByChampionId(championId: number, culture: DragonCulture = DragonCulture.fr_fr): Promise<IChampion> {
//     // Get Summoner on DB
//     // TODO: Cache for DragonService
//     // const dragonChampionData: Array<IChampion> = await DragonService.readDragonChampionFile(culture);
//     // const dragonChamp = dragonChampionData.find(e => e.id === championId.toString());

//     let returnValue : IChampion;
//     // if (dragonChamp) {
//     //     returnValue = dragonChamp;
//     // }
//     return returnValue!;
// }

// export default {
//     getChampionDetailsByChampionId,
// };

