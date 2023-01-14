import { IChampion } from "./ChampionInfo";

export interface IChampionMastery {
    championId: number;
    championLevel: number;
    summonerId: string;
    championPoints: number;

    chestGranted: boolean;
    championPointsUntilNextLevel: number;
    championPointsSinceLastLevel: number;
    tokensEarned: number;
    lastPlayTime: Date;
}

export interface IChampionMasteryExt {
    champion: IChampion;

    championLevel?: number;
    championPoints: number;

    chestGranted: boolean;
    championPointsUntilNextLevel?: number;
    championPointsSinceLastLevel?: number;
    tokensEarned?: number;
    lastPlayTime?: Date;

    toString(): string;
}

export class ChampionMasteryExt  implements IChampionMasteryExt {
    champion!: IChampion;

    championLevel?: number;
    championPoints: number = 0;

    chestGranted: boolean = false;
    championPointsUntilNextLevel?: number;
    championPointsSinceLastLevel?: number;
    tokensEarned?: number;
    lastPlayTime?: Date;

    toString(): string {
        const returnValue = `${this.champion?.name} (${this.championPoints} pts)`;
        return returnValue.trimEnd();
    }
}

export class ChampionMastery {
    championMastery: ChampionMasteryExt[] = [];

    toString(): string {
        let returnValue = '';
        this.championMastery.forEach(function (champion: ChampionMasteryExt) {
            if (returnValue.length > 0) { returnValue += ' | '; }

            returnValue += champion.toString();
        });
        return returnValue.trimEnd();
    }
    
    getResult(n: number) : string {
        let returnValue = '';
        for (let index = 0; index < n; index++) {
            const element = this.championMastery[index];
            if (returnValue.length > 0) { returnValue += ' | '; }

            returnValue += element.toString(); 
        }
       
        return returnValue.trimEnd();       
    }
}