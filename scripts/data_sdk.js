// Lightweight client-side dataSdk for /api/records
(function () {
    const base = '/api/records';

    async function fetchAll() {
        const r = await fetch(base);
        const json = await r.json();
        return json.ok ? json.data : [];
    }

    function createPolling(handler, interval = 5000) {
        let stopped = false;
        async function tick() {
            if (stopped) return;
            const data = await fetchAll();
            if (handler && typeof handler.onDataChanged === 'function') handler.onDataChanged(data);
            setTimeout(tick, interval);
        }
        tick();
        return () => { stopped = true; };
    }

    window.dataSdk = {
        async init(handler) {
            try {
                const data = await fetchAll();
                if (handler && typeof handler.onDataChanged === 'function') handler.onDataChanged(data);
                const stop = createPolling(handler, 5000);
                this._stopPolling = stop;
                return { isOk: true };
            } catch (e) {
                console.error(e);
                return { isOk: false, error: e.message };
            }
        },

        async create(record) {
            try {
                const r = await fetch(base, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(record)
                });
                const json = await r.json().catch(()=>({}));
                return { isOk: r.ok, data: json.data, error: json.error };
            } catch (e) {
                return { isOk: false, error: e.message };
            }
        },

        async delete(record) {
            try {
                const id = (record && record.__backendId) || (record && record._id) || record;
                const r = await fetch(`${base}/${encodeURIComponent(id)}`, { method: 'DELETE' });
                const json = await r.json().catch(()=>({}));
                return { isOk: r.ok, data: json, error: json && json.error };
            } catch (e) {
                return { isOk: false, error: e.message };
            }
        },

        stop() { if (this._stopPolling) this._stopPolling(); }
    };
})();