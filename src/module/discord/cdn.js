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
    avatar(id, avatarHash, discriminator, options) {
        if (avatarHash) {
            return this.dynamicMakeURL(`/avatars/${id}/${avatarHash}`, avatarHash, options);
        } else {
            return this.defaultAvatar(discriminator);
        }
    }
    banner(id, bannerHash, options) {
        if (bannerHash) {
            return this.dynamicMakeURL(`/banners/${id}/${bannerHash}`, bannerHash, options);
        } else {
            return '';
        }

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
        if (iconHash) {
            return this.dynamicMakeURL(`/icons/${id}/${iconHash}`, iconHash, options);
        } else {
            return null;
        }
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

        const url = new URL(`${this.base}${route}.${extension}`);
        if (size) {
            url.searchParams.set("size", String(size));
        }
        return url.toString();
    }
}

CDN.SIZES = {
    "16": 16,
    "32": 32,
    "64": 64,
    "128": 128,
    "256": 256,
    "512": 512,
    "1024": 1024,
    "2048": 2048,
    "4096": 4096
};

module.exports = { CDN };

