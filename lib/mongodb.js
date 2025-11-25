// simple Mongo connection helper for serverless functions
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

let cachedClient = global.__mongoClient;
let cachedDb = global.__mongoDb;

async function connect() {
    if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'nexzen_pro');
    cachedClient = client;
    cachedDb = db;
    global.__mongoClient = cachedClient;
    global.__mongoDb = cachedDb;
    return { client: cachedClient, db: cachedDb };
}

module.exports = { connect };