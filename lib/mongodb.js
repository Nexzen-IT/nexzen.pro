// simple Mongo connection helper for serverless functions
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI environment variable is required');

const dbName = process.env.MONGODB_DB || 'websiteAnalytics';

// serverless-friendly cache
let cached = global.__mongo;
if (!cached) cached = global.__mongo = { client: null, db: null, promise: null };

async function connect() {
  if (cached.db && cached.client) {
    return { client: cached.client, db: cached.db };
  }
  if (!cached.promise) {
    cached.promise = (async () => {
      const client = new MongoClient(uri, { maxPoolSize: 10 });
      await client.connect();
      const db = client.db(dbName);
      // optional: create common indexes once (safe to run repeatedly)
      try {
        const col = db.collection('records');
        await col.createIndex({ type: 1, createdAt: -1 });
        await col.createIndex({ type: 1, email: 1 }, { unique: false, partialFilterExpression: { email: { $exists: true } } });
      } catch (e) {
        // ignore index errors in cold starts
      }
      cached.client = client;
      cached.db = db;
      return { client, db };
    })();
  }
  return cached.promise;
}

module.exports = { connect };