import moment from 'moment';
import EnvVars from '../../declarations/major/EnvVars';
import { BedyMapper } from '../../mapper/mapper';
import { ISummonerDTO } from 'bedyriot';

moment.locale(EnvVars.culture);

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { sequelize } = require('../../db/dbSchema');
const { RIOT_Summoner } = sequelize.models;

/**
 * Interface who contains extends {ISummonerDTO} and dbSummonerInfo 
 */
export interface IRiotSummoner extends ISummonerDTO {
    // Db Only
    dbId?: string;
    expiredKey?: Date;

    // Function
    requireUpdate(): boolean;
    toString(): string;
}

export class RiotSummoner implements IRiotSummoner {
    id = '';
    accountId = '';
    profileIconId = 0;
    puuid = '';
    name = '';
    summonerLevel = 0;
    revisionDate?: undefined;
    dbId?: string | undefined;
    expiredKey?: Date | undefined;

    requireUpdate(): boolean {
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

/**
 * Check if summoner is on DB
 * @param summonerName 
 * @param region 
 * @returns 
 */
async function getRiotSummonerByName(summonerName: string, region: string): Promise<RiotSummoner> {
    // Get Summoner on DB
    let summoner: RiotSummoner;

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    await RIOT_Summoner.findSummonerBySummonerName(summonerName, region).then((dbResult: any) => {
        if (dbResult) {
            summoner = BedyMapper.MapToRiotSummoner(dbResult, true);
        }
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    }).catch((error: any) => {
        throw error;
    });

    return summoner!;
}

export default {
    getRiotSummonerByName,
};