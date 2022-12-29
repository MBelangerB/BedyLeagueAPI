export interface IChampionInfo {
    maxNewPlayerLevel: number,
    freeChampionIdsForNewPlayers: Array<number>,
    freeChampionIds: Array<number>,
}

export interface IChampionInfoExt {
    freeChampionForNewPlayers: Array<IChampion>;
    freeChampion: Array<IChampion>;

    getFreeChampionStr() : string;
    getNewbiesFreeChampionStr() : string;
}

export interface IChampion {
    id: string,
    name: string,
}

export class ChampionInfoExt implements IChampionInfoExt {
    freeChampionForNewPlayers: IChampion[] = [];
    freeChampion: IChampion[] = [];

    getFreeChampionStr() : string {
        let returnValue = '';

        this.freeChampion.forEach(function (champ) {
            if (returnValue.length > 0) { returnValue += ' | '; }
            returnValue += champ.name;
        });

        returnValue = returnValue.trimEnd();

        return returnValue;
    }

    getNewbiesFreeChampionStr() : string {
        let returnValue = '';

        this.freeChampionForNewPlayers.forEach(function (champ) {
            if (returnValue.length > 0) { returnValue += ' | '; }
            returnValue += champ.name;
        });

        returnValue = returnValue.trimEnd();

        return returnValue;
    }
}