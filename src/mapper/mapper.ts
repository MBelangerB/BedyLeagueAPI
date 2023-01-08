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
}