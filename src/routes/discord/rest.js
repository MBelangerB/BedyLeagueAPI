const { AuthController } = require('../../controller/api/AuthController');
const { DiscordRestController } = require('../../controller/discord/DiscordRestController');
const { DiscordMapper } = require('../../module/discord/DiscordMapper');
const { CDN } = require('../../module/discord/cdn');

require('dotenv').config();

const discordRest = {

    /**
     * Get User information
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async userInfo(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [token] = [fragment.get('token')];

        try {
            const payload = req.payload;
            if (!payload) {
                return res.sendStatus(401);
            }
            const userId = payload.payload.userId;
            const mapper = new DiscordMapper();

            // We have accessToken we try to call Discord API for get UserInfo
            const userInfo = await DiscordRestController.getDiscordUserInfo('Bearer', token);
            const guildData = await DiscordRestController.loadGuilds(userId);

            // We get updated info, we update DB user
            if ((userInfo && userInfo.OK) && (guildData && guildData.length > 0)) {
                const returnData = {
                    guild: {
                        owner: guildData.filter(f => f.owner).length || 0,
                        manager: guildData.filter(f => mapper.canAddBot(f)).length || 0,
                    },
                    user: mapper.castUserInfo(userInfo.data)
                }

                return res.status(200).json({
                    data: returnData,
                    OK: true,
                });
            } else {
                res.status(401).send({
                    OK: false,
                    msg: 'An error occured. Token is is invalid or revoked.'
                });
            }
        } catch (ex) {
            console.error('A error occured in DiscordAuth.userInfo')
            console.error(ex);
            res.status(400).send({
                OK: false,
                msg: 'A error occured. Please try again.'
            })
        }
    },

    /**
     * Get the current user Server list
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async serverList(req, res, next) {
        const fragment = new URLSearchParams(req.query);
        const [token, adminOnly] = [fragment.get('token'), fragment.get('adminOnly')];

        try {
            const payload = req.payload.payload;
            if (!payload) {
                return res.sendStatus(401);
            }
            const mapper = new DiscordMapper();
            const userId = payload.userId;

            // Check if user has a guild in DB
            let guildData = await DiscordRestController.loadGuilds(userId);
            if (!guildData || guildData.length == 0) {
                // We call Discord
                const guildInfo = await DiscordRestController.getGuilds('Bearer', token);
                if (guildInfo && guildInfo.OK) {
                    let datas = guildInfo.data;
                    if (adminOnly) {
                        datas = guildInfo.data.filter(f => f.owner || mapper.canAddBot(f));
                        // Trier ceux ou il est deja installé en premier. Ensuite des bouton pour le 
                        // trie (Deja Installé / Non installé) devront être mis en Front
                    }

                    // We persist data in DB
                    await datas.reduce(async (oldGuild, guild) => {
                        await oldGuild;

                        const dbGuild = await DiscordRestController.createOrLoadGuild(guild, false);
                        if (dbGuild) {
                            await DiscordRestController.persistGuildPermission(guild, dbGuild, userId);
                        }
                    }, Promise.resolve());

                    guildData = guildInfo.data;
                }
                else {
                    return res.status(400).send({
                        OK: false,
                        msg: 'An error occured. Cant obtains data'
                    });
                }
            }

            // If all is OK
            const guildInfo = await DiscordRestController.loadBotGuild();
            const frontData = mapper.castServerDataList(guildInfo, guildData, adminOnly);
            if (frontData && frontData.length > 0) {
                res.status(200).send({
                    OK: true,
                    data: frontData
                });
            } else {
                res.status(400).send({
                    OK: false,
                    msg: 'An error occured. Cant obtains data'
                });
            }

        } catch (ex) {
            console.error('A error occured in DiscordAuth.serverList')
            console.error(ex);
            res.status(400).send({
                OK: false,
                msg: 'A error occured. Please try again.'
            })
        }
    },

}

module.exports = { discordRest }