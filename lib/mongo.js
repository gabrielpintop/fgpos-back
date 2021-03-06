const {
    MongoClient,
    ObjectId
} = require('mongodb');
const {
    config
} = require('../config');

const USER = encodeURIComponent(config.dbUser);
const PASSWORD = encodeURIComponent(config.dbPassword);
const DB_NAME = config.dbName;

const MONGO_URI = `mongodb+srv://${USER}:${PASSWORD}@${config.dbHost}:${config.dbPort}/${DB_NAME}?retryWrites=true&w=majority`;

class MongoLib {

    constructor() {
        this.client = new MongoClient(MONGO_URI, {
            useNewUrlParser: true
        });
        this.dbName = DB_NAME;
    }

    connect() {

        if (!MongoLib.connection) {
            MongoLib.connection = new Promise((resolve, reject) => {
                this.client.connect(err => {

                    if (err) {
                        console.log(err);
                        reject(err);
                    }

                    console.log('Connected successfully to MongoDb');
                    resolve(this.client.db(this.dbName));
                });
            });
        }

        return MongoLib.connection;
    }

    getAll(collection, query, projection) {
        return this.connect().then(db => {
            return db.collection(collection).find(query).project(projection).toArray();
        });
    }

    get(collection, id) {
        return this.connect().then(db => {
            return db.collection(collection).findOne({
                _id: ObjectId(id)
            });
        });
    }

    create(collection, data) {
        return this.connect().then(db => {
            return db.collection(collection).insertOne(data);
        }).then(result => result.insertedId);
    }

    update(collection, data, id) {
        return this.connect().then(db => {
            return db.collection(collection).updateOne({
                _id: ObjectId(id)
            }, {
                $set: data
            }, {
                upsert: true
            });
        }).then(result => result.upsertedId || id);
    }

    delete(collection, id) {
        return this.connect().then(db => {
            return db.collection(collection).deleteOne({
                _id: ObjectId(id)
            });
        }).then(() => id);
    }

    updateBulkWrite(collection, bulkOperations) {
        const bulk = [];
        bulkOperations.forEach(element => {
            bulk.push({
                updateOne: {
                    filter: {
                        _id: ObjectId(element.id)
                    },
                    update: element.update
                }
            });
        });

        return this.connect().then(db => {
            return db.collection(collection).bulkWrite(bulk);
        }).then(result => result);
    }
}

module.exports = MongoLib;