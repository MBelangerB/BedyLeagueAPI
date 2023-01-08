import moment from 'moment';
import EnvVars from '../../declarations/major/EnvVars';
import { BedyMapper } from '../../mapper/mapper';

moment.locale(EnvVars.culture);

// import sequelize = require('../../db/dbSchema');
const { sequelize } = require('../../db/dbSchema');
const { RIOT_Summoner } = sequelize.models;

export interface IRiotSummoner {
    id: string;
    accountId: string;
    profileIconId: number;
    puuid: string;
    name: string;
    summonerLevel: number;

    // Riot Only
    revisionDate?: Date;

    // Db Only
    dbId?: string;
    expiredKey?: Date;

    // Function
    requireUpdate() : boolean;
    toString() : string;
}

export class RiotSummoner implements IRiotSummoner {
    id = '';
    accountId = '';
    profileIconId = 0;
    puuid = '';
    name = '';
    summonerLevel = 0;
    revisionDate?: Date | undefined;
    dbId?: string | undefined;
    expiredKey?: Date | undefined;

    requireUpdate() : boolean {
        if (this.dbId) {
            const lastUpdate = moment(this.revisionDate);
            if (moment().diff(lastUpdate, 'hours') >= EnvVars.config.updateDelay) {
              return true;
            } else {
              return false;
            }
        }
        return false; // it's not a DB user, update isn't important
    }

    toString(): string {
        const returnValue = `${this.name} (Niv ${this.summonerLevel})`;
        return returnValue.trimEnd();
    }
}


export interface ISummonerInfo {
    riotSummoner: IRiotSummoner,
    dbSummoner: IRiotSummoner
}

async function getRiotSummonerByName(summonerName: string, region: string): Promise<RiotSummoner> {
    // Get Summoner on DB
    let summoner: RiotSummoner | null = new RiotSummoner();

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    await RIOT_Summoner.findSummonerBySummonerName(summonerName, region).then((dbResult: any) => {
        summoner = BedyMapper.MapToRiotSummoner(dbResult, true);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    }).catch((error: any) => {
        throw error;
    });

    if (!summoner) {
        throw Error('Null summoner');
    }

    return summoner;
}

export default {
    getRiotSummonerByName,
};