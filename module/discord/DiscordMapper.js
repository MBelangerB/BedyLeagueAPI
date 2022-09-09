'use strict';
const { CDN } = require('../../module/discord/cdn');

class DiscordMapper {

    castServerDataList(data) {
        const cdn = new CDN();
        const serverlist = [];

        data.forEach(server => {
            const data = {
                id: server.id,
                name: server.name,
                icon: {
                   xSmall: cdn.icon(server.id, server.icon, {size: CDN.SIZES[16]} ) || server.icon, 
                   small: cdn.icon(server.id, server.icon, {size: CDN.SIZES[32]} ) || server.icon, 
                   medium: cdn.icon(server.id, server.icon, {size: CDN.SIZES[64]} ) || server.icon, 
                }, 
                owner: server.owner,
                permissions: server.permissions,
                canManage: this.#canAddBot(server),
            }
            serverlist.push(data);
        });

        const sortedList = serverlist.sort(function (a, b) {
            return (a.owner > b.owner || (a.canManage > b.canManage));
        });

        return sortedList;
    }


    #canAddBot(server) {
        if (server.owner == true) {
            return true;
        }
        if (this.#isAdmin(server.permissions)) {
            return true;
        }

        return false;
    }

    #isAdmin(permissions) {
      //  return permissions & this.PermissionFlagsBits.ADMINISTRATOR == this.PermissionFlagsBits.ADMINISTRATOR;
      const permBit = this.#bnToHex(DiscordMapper.PermissionFlagsBits.Administrator, true);
      return ((permissions & permBit) == permBit);
    }

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