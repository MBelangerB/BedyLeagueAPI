'use strict';
const { CDN } = require('../../module/discord/cdn');

class DiscordMapper {

    /**
     * Cast info to FrontEnd
     * @param {*} data 
     * @param {*} adminOnly 
     * @returns 
     */
    castServerDataList(botGuild, datas, adminOnly) {
        const cdn = new CDN();
        const serverlist = [];

        datas.forEach(server => {
            const data = {
                id: server.id,
                name: server.name,
                shortName: this.#getShortName(server.name),
                hasIcon: (server.icon != null),
                icon: {
                    xSmall: cdn.icon(server.id, server.icon, { size: CDN.SIZES[16] }) || null,
                    small: cdn.icon(server.id, server.icon, { size: CDN.SIZES[32] }) || null,
                    medium: cdn.icon(server.id, server.icon, { size: CDN.SIZES[64] }) || null,
                    large: cdn.icon(server.id, server.icon, { size: CDN.SIZES[128] }) || null,
                },
                owner: server.owner,
                permissions: server.permissions,
                canManage: this.canAddBot(server),
                isPresent: botGuild.filter(f => f.id === server.id).length > 0,
            }
            serverlist.push(data);
        });

        let sortedList;
        if (adminOnly) {
            sortedList = serverlist.filter(f => f.owner || f.canManage);
            sortedList = sortedList.sort(function (a, b) {
                return a.name.localeCompare(b.name);
                // if(a.firstname < b.firstname) { return -1; }
                // if(a.firstname > b.firstname) { return 1; }
                // return 0;
            });
        } else {
            sortedList = serverlist.sort(function (a, b) {
                return (a.owner > b.owner || (a.canManage > b.canManage));
            });
        }

        return sortedList;
    }

    /**
     * Cast UserInfo to profile format
     * @param {*} userInfo 
     * @returns 
     */
    castUserInfo(userInfo) {
        const cdn = new CDN();
        return {
            username: userInfo.username,
            discriminator: userInfo.discriminator,
            avatar: {
                xSmall: cdn.avatar(userInfo.id, userInfo?.avatar, userInfo.discriminator, { size: CDN.SIZES[16] }) || '',
                small: cdn.avatar(userInfo.id, userInfo?.avatar, userInfo.discriminator, { size: CDN.SIZES[32] }) || '',
                medium: cdn.avatar(userInfo.id, userInfo?.avatar, userInfo.discriminator, { size: CDN.SIZES[64] }) || '',
                large: cdn.avatar(userInfo.id, userInfo?.avatar, userInfo.discriminator, { size: CDN.SIZES[128] }) || '',
            },
            banner: {
                small: cdn.banner(userInfo.id, userInfo?.banner, { size: CDN.SIZES[512] }) || '',
                medium: cdn.banner(userInfo.id, userInfo?.banner, { size: CDN.SIZES[1024] }) || '',
                normal: cdn.banner(userInfo.id, userInfo?.banner, { size: CDN.SIZES[2048] }) || '',
                large: cdn.banner(userInfo.id, userInfo?.banner, { size: CDN.SIZES[4096] }) || '',
            },
            bannerColor: (userInfo.banner_color),
            accenColor: this.#bnToHex(userInfo.accent_color),
            verified: userInfo.verified,
            locale: userInfo.locale
        }    
    }

    /**
     * Check if user has a permission for add the bot
     * @param {*} server 
     * @returns 
     */
    canAddBot(server) {
        if (server.owner == true) {
            return true;
        }
        // if (this.#isAdmin(server.permissions)) {
        if (this.#isAdmin(server.permissions_new)) {
            return true;
        }

        return false;
    }

    /**
     * Check if user has ADMIN permission flag
     * @param {*} permissions 
     * @returns 
     */
    #isAdmin(permissions) {
        //  return permissions & this.PermissionFlagsBits.ADMINISTRATOR == this.PermissionFlagsBits.ADMINISTRATOR;
        const permBit = this.#bnToHex(DiscordMapper.PermissionFlagsBits.Administrator, true);
        return ((permissions & permBit) == permBit);
    }

    /**
     * Cast the value at Hex (base 16)
     * @param {*} bn 
     * @param {*} withZero 
     * @returns 
     */
    #bnToHex(bn, withZero = false) {
        var base = 16;
        var hex = BigInt(bn).toString(base);
        if (hex.length % 2) {
            hex = '0' + hex;
        }
        if (hex && withZero) {
            return '0x' + hex;
        }
        return hex;
    }

    /**
     * Cast the guild name at short value
     * @param {*} serverName 
     * @returns 
     */
    #getShortName(serverName) {
        //TODO: Keep de -
        const regex = /\b[-a-zA-Z]/gi;

        // Alternative syntax using RegExp constructor
        // const regex = new RegExp('\\b[a-zA-Z]', 'gm')
        let m;
        let value = '';

        while ((m = regex.exec(serverName)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                value += match;
            });
        }

        return value;
    }

}

DiscordMapper.PermissionFlagsBits = {
    CreateInstantInvite: 1n << 0n,
    KickMembers: 1n << 1n,
    BanMembers: 1n << 2n,
    Administrator: 1n << 3n,
    ManageChannels: 1n << 4n,
    ManageGuild: 1n << 5n,
    AddReactions: 1n << 6n,
    ViewAuditLog: 1n << 7n,
    PrioritySpeaker: 1n << 8n,
    Stream: 1n << 9n,
    ViewChannel: 1n << 10n,
    SendMessages: 1n << 11n,
    SendTTSMessages: 1n << 12n,
    ManageMessages: 1n << 13n,
    EmbedLinks: 1n << 14n,
    AttachFiles: 1n << 15n,
    ReadMessageHistory: 1n << 16n,
    MentionEveryone: 1n << 17n,
    UseExternalEmojis: 1n << 18n,
    ViewGuildInsights: 1n << 19n,
    Connect: 1n << 20n,
    Speak: 1n << 21n,
    MuteMembers: 1n << 22n,
    DeafenMembers: 1n << 23n,
    MoveMembers: 1n << 24n,
    UseVAD: 1n << 25n,
    ChangeNickname: 1n << 26n,
    ManageNicknames: 1n << 27n,
    ManageRoles: 1n << 28n,
    ManageWebhooks: 1n << 29n,
    ManageEmojisAndStickers: 1n << 30n,
    UseApplicationCommands: 1n << 31n,
    RequestToSpeak: 1n << 32n,
    ManageEvents: 1n << 33n,
    ManageThreads: 1n << 34n,
    CreatePublicThreads: 1n << 35n,
    CreatePrivateThreads: 1n << 36n,
    UseExternalStickers: 1n << 37n,
    SendMessagesInThreads: 1n << 38n,
    UseEmbeddedActivities: 1n << 39n,
    ModerateMembers: 1n << 40n,
};
Object.freeze(DiscordMapper.PermissionFlagsBits);


module.exports = {
    DiscordMapper,
};