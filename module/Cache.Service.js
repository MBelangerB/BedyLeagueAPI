const NodeCache = require('node-cache');

module.exports = class Cache {

  constructor(ttlSeconds) {
    this.cache = new NodeCache({ stdTTL: ttlSeconds, checkperiod: ttlSeconds * 0.2, useClones: false });
  }

  get(key, storeFunction) {
    const value = this.cache.get(key);
    if (value) {
      return Promise.resolve(value);
    }

    return storeFunction().then(function (result) {
      this.cache.set(key, result);
      return result;
    });
  }

   getAsync(key) {
    const value = this.cache.get(key);
    if (value) {
      return Promise.resolve(value);
    } else {
    //  return Promise.reject("NoData");
        return null;
    }
  }

  async getAsyncB(key) {
    var lCache = this.cache;
    return new Promise(function (resolve, reject) {
      const value = lCache.get(key);
      resolve(value);
  });
  }

  setCacheValue(key, result) {
    this.cache.set(key, result);
  }

  del(keys) {
    this.cache.del(keys);
  }

  delStartWith(startStr = '') {
    if (!startStr) {
      return;
    }

    const keys = this.cache.keys();
    for (const key of keys) {
      if (key.indexOf(startStr) === 0) {
        this.del(key);
      }
    }
  }

  flush() {
    this.cache.flushAll();
  }

  checkCacheExists(cacheKey) {
    var cacheInfo = cache.getAsync(cacheKey);
    var result;

    if (cacheInfo !== null) {
      cacheInfo.then(function (value) {
          result = value;
      }) 
    }

    return (result || cacheInfo);
  }


}


// export default Cache;