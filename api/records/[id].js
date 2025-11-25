const { connect } = require('../../../lib/mongodb');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
    const { db } = await connect();
    const collection = db.collection('records');
    const { id } = req.query;

    if (req.method === 'DELETE') {
        try {
            const result = await collection.deleteOne({ _id: new ObjectId(id) });
            if (result.deletedCount === 0) return res.status(404).json({ ok: false, error: 'Not found' });
            return res.status(200).json({ ok: true });
        } catch (err) {
            return res.status(400).json({ ok: false, error: 'Invalid id' });
        }
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};