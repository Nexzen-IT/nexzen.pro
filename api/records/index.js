const { connect } = require('../../../lib/mongodb');

module.exports = async (req, res) => {
    const { db } = await connect();
    const collection = db.collection('records');

    if (req.method === 'GET') {
        const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
        const normalized = docs.map(d => ({ ...d, __backendId: d._id.toString() }));
        return res.status(200).json({ ok: true, data: normalized });
    }

    if (req.method === 'POST') {
        const payload = req.body || {};
        payload.createdAt = payload.createdAt || new Date().toISOString();
        const result = await collection.insertOne(payload);
        const inserted = await collection.findOne({ _id: result.insertedId });
        inserted.__backendId = inserted._id.toString();
        return res.status(201).json({ ok: true, data: inserted });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};