const { connect } = require('../../../lib/mongodb');

module.exports = async (req, res) => {
    const { db } = await connect();
    const col = db.collection('records');

    if (req.method === 'POST') {
        // increment visits counter document
        const filter = { _id: 'site_visits' };
        const update = {
            $inc: { count: 1 },
            $setOnInsert: { createdAt: new Date(), type: 'customer_count' }
        };
        const opts = { upsert: true, returnDocument: 'after' };
        try {
            const result = await col.findOneAndUpdate(filter, update, opts);
            const count = result.value?.count ?? 0;
            return res.status(200).json({ ok: true, count });
        } catch (err) {
            console.error('visit increment error', err);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }
    }

    if (req.method === 'GET') {
        try {
            const doc = await col.findOne({ _id: 'site_visits' });
            return res.status(200).json({ ok: true, count: (doc && doc.count) || 0 });
        } catch (err) {
            console.error('visit fetch error', err);
            return res.status(500).json({ ok: false, error: 'db_error' });
        }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
};