import { BedyMapper } from '../mapper/mapper';
import { RiotSummoner } from '../models/riot/RiotSummoner';

// **** Variables **** //
const { sequelize } = require('../db/dbSchema');
const { RIOT_Summoner, RIOT_SummonerHistory } = sequelize.models;

// Errors
export const errors = {
    unauth: 'Unauthorized',
    errParamsIsInvalid: (paramsName: string, region: string) => `The parameters '${paramsName}' with value '${region}' is invalid.`,
    errParamsIsMissing: (params: string) => `The parameter '${params}' is mandatory.`,
    errInFunction: (functionName: string) => `An error occured in "RiotDatabaseService.${functionName}"`,
} as const;

// **** Classes **** //

export class RiotDatabaseService {
    /**
     * [DB] Add Riot Summoner info on DB
     * @param {*} summonerInfo Information actuel provenant de API de Riot
     * @returns
     */
    static async createOrUpdateSummoner(summonerInfo: RiotSummoner, region: string): Promise<RiotSummoner> {
        try {
            let dbSummoner: RiotSummoner | undefined;
            let entity: any;

            // todo: Promise
            // Check if RiotID exist, occured if a summoner change his SummonerName
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            await RIOT_Summoner.findSummonerByRiotId(summonerInfo.id).then((result: any) => {
                entity = result;
                dbSummoner = BedyMapper.MapToRiotSummoner(result, true);
            });

            if (dbSummoner !== null || typeof dbSummoner !== 'undefined') {
                // If summonerName has change
                if (dbSummoner?.name !== summonerInfo.name) {
                    await RIOT_SummonerHistory.addSummonerHistory(dbSummoner?.id, dbSummoner?.name, dbSummoner?.summonerLevel);
                }
                // Cant update because WE NEED original object
                await entity.updateSummonerInfo(summonerInfo.name, summonerInfo.summonerLevel, summonerInfo.profileIconId);
            } else {
                dbSummoner = await RIOT_Summoner.addSummoner(summonerInfo.id, summonerInfo.accountId, summonerInfo.puuid,
                    summonerInfo.name, summonerInfo.summonerLevel, summonerInfo.profileIconId, region);
            }

            return dbSummoner!;

            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        } catch (error: any) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                console.error('That RIOT_Summoner already exists.', error);
            } else {
                console.error('A error occured in RiotSummonerController.createOrUpdateSummoner.', error);
            }
            return error;
        }
    }

}

// **** Functions **** //

// **** Export default **** //

export default {
    errors,
    RiotDatabaseService,
} as const;
