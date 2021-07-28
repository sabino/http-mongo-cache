# http-mongo-cache
A very simple http cache that stores data to mongodb

## Installation
```
npm install https://github.com/sabino/http-mongo-cache.git
```

## Usage

```javascript

const dbName = 'my-db-name';
const collectionName = 'my-collection';
const mongoUrl = 'mongodb://user:pass@server/something:1234';

const cachedRequest = new CachedRequest({
    mongoUrl,
    collectionName,
    dbName
});

let forceRequest = false;
let url = "https://random-data-api.com/api/beer/random_beer?size=3"
let options = {
    method: "GET",
    host: "random-data-api.com",
    path: "/api/beer/random_beer?size=3",
}

cachedRequest.get(url, options, (result) => {
    try {
        let json = JSON.parse(result);
        console.log(json);
    } catch (err) {
        console.log(err);
    }
}, forceRequest);

```
