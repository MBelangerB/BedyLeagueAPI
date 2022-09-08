'use strict';

const staticInfo = require('../../static/info.json')

const ALLOWED_EXTENSIONS = ["webp", "png", "jpg", "jpeg", "gif"];
const ALLOWED_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

class CDN {
    constructor(base = staticInfo.discord.cdn.url) {
        this.base = base;
    }

    appIcon(clientId, iconHash, options) {
        return this.makeURL(`/app-icons/${clientId}/${iconHash}`, options);
    }
    avatar(id, avatarHash, options) {
        return this.dynamicMakeURL(`/avatars/${id}/${avatarHash}`, avatarHash, options);
    }
    channelIcon(channelId, iconHash, options) {
        return this.makeURL(`/channel-icons/${channelId}/${iconHash}`, options);
    }
    defaultAvatar(discriminator) {
        return this.makeURL(`/embed/avatars/${discriminator}`, { extension: "png" });
    }
    emoji(emojiId, extension) {
        return this.makeURL(`/emojis/${emojiId}`, { extension });
    }
    guildMemberAvatar(guildId, userId, avatarHash, options) {
        return this.dynamicMakeURL(`/guilds/${guildId}/users/${userId}/avatars/${avatarHash}`, avatarHash, options);
    }
    guildMemberBanner(guildId, userId, bannerHash, options) {
        return this.dynamicMakeURL(`/guilds/${guildId}/users/${userId}/banner`, bannerHash, options);
    }
    icon(id, iconHash, options) {
        return this.dynamicMakeURL(`/icons/${id}/${iconHash}`, iconHash, options);
    }
    roleIcon(roleId, roleIconHash, options) {
        return this.makeURL(`/role-icons/${roleId}/${roleIconHash}`, options);
    }


    dynamicMakeURL(route, hash, { forceStatic = false, ...options } = {}) {
        return this.makeURL(route, !forceStatic && hash.startsWith("a_") ? { ...options, extension: "gif" } : options);
    }

    makeURL(route, { allowedExtensions = ALLOWED_EXTENSIONS, extension = "webp", size } = {}) {
        extension = String(extension).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            throw new RangeError(`Invalid extension provided: ${extension} Must be one of: ${allowedExtensions.join(", ")}`);
        }
        if (size && !ALLOWED_SIZES.includes(size)) {
            throw new RangeError(`Invalid size provided: ${size} Must be one of: ${ALLOWED_SIZES.join(", ")}`);
        }

       // const baseUrl = staticInfo.discord.cdn.url;

        const url = new URL(`${this.base}${route}.${extension}`);
        if (size) {
            url.searchParams.set("size", String(size));
        }
        return url.toString();
    }
}

module.exports = { CDN };

