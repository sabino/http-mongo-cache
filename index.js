const MongoClient = require('mongodb').MongoClient;
const http = require("https");

function merge(obj1, obj2) {
    let obj3 = {};
    for (let attrname in obj1) {
        obj3[attrname] = obj1[attrname];
    }
    for (let attrname in obj2) {
        obj3[attrname] = obj2[attrname];
    }
    return obj3;
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

class CachedRequest {
    constructor(obj) {
        const {
            mongoUrl,
            collectionName,
            dbName
        } = obj;
        this.mongoUrl = mongoUrl;
        this.collectionName = collectionName;
        this.dbName = dbName;
        this.collection = this.getCollection();
    }

    async get(url, parameters, callback, force) {
        let cacheKey = this.generateCacheKey(url, parameters);
        let cache = await this.getCache(cacheKey);
        if (!force && cache) {
            callback(cache);
        } else {
            await this.makeRequest(url, parameters, async (result) => {
                await this.clearCacheFor(url, parameters);
                await this.saveCache(cacheKey, result);
                callback(result);
            });
        }
    }

    async saveCache(cacheKey, result) {
        let collection = await this.collection;
        let cache = {
            url: cacheKey.url,
            parameters: cacheKey.parameters,
            result: result
        };
        await collection.insertOne(cache);
    }

    async getCache(cacheKey) {
        let collection = await this.collection;
        let cache = await collection.findOne({
            url: cacheKey.url,
            parameters: cacheKey.parameters
        });
        return isJsonString(cache) ? cache : cache.result;
    }

    async clearAllCache() {
        let collection = await this.collection;
        await collection.drop({});
    }

    async clearCacheFor(url) {
        let cacheKey = this.generateCacheKey(url, parameters);
        let collection = await this.collection;
        let result = await collection.deleteMany({
            url: cacheKey.url
        });
        return result
    }

    async clearCacheFor(url, parameters) {
        let cacheKey = this.generateCacheKey(url, parameters);
        let collection = await this.collection;
        let result = await collection.deleteMany({
            url: cacheKey.url,
            parameters: cacheKey.parameters
        });
        return result
    }

    async makeRequest(url, parameters, callback) {
        let options = this.partialRequest(url, parameters);
        let req = http.request(options, (res) => {
            let result = '';
            res.on('data', (chunk) => {
                result += chunk;
            });
            res.on('end', () => {
                callback(result);
            });
        });
        req.end();
    }

    async getCollection() {
        let db = await MongoClient.connect(this.mongoUrl);
        let collection = db.db(this.dbName).collection(this.collectionName);
        return collection;
    }

    partialRequest(url, parameters) {
        let request = merge({
            host: url.split('/')[2],
            path: url.split("/")[3],
            method: "GET",
            headers: {}
        }, parameters);
        return request;
    }

    generateCacheKey(url, parameters) {
        let parametersObj = {
            host: parameters.host,
            path: parameters.path,
            method: parameters.method,
            headers: {}
        }
        let cacheKey = {
            url: url.toLowerCase(),
            parameters: JSON.stringify(parametersObj)
        };
        return cacheKey;
    }
}

module.exports = CachedRequest;