// create a customer_count record so the app's dataSdk picks it up and increments #customer-counter
(async function () {
    const COUNTER_ID = 'customer-counter';
    const RECORDS_API = '/api/records';
    const fallbackKey = 'visitor_count_fallback';

    function setCounter(n) {
        const el = document.getElementById(COUNTER_ID);
        if (!el) return;
        el.textContent = Number(n).toLocaleString() + '+';
    }

    function readBaseFromDom() {
        const el = document.getElementById(COUNTER_ID);
        if (!el) return 0;
        const digits = (el.textContent || '').replace(/[^\d]/g, '');
        return parseInt(digits || '0', 10) || 0;
    }

    const base = readBaseFromDom();

    // Try to create a record server-side
    try {
        const payload = { type: 'customer_count', createdAt: new Date().toISOString() };
        const resp = await fetch(RECORDS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (resp.ok) {
            // fetch authoritative list and compute count
            const allResp = await fetch(RECORDS_API);
            if (allResp.ok) {
                const j = await allResp.json();
                const customerCountDocs = (j.data || []).filter(d => d.type === 'customer_count').length;
                setCounter(base + customerCountDocs);
                localStorage.setItem(fallbackKey, String(base + customerCountDocs));
                return;
            }
        }
        throw new Error('POST/create failed');
    } catch (err) {
        // fallback: increment local counter in localStorage
        const prev = parseInt(localStorage.getItem(fallbackKey) || String(base), 10) || base;
        const next = prev + 1;
        localStorage.setItem(fallbackKey, String(next));
        setCounter(next);
    } finally {
        // background: refresh authoritative count if API available
        try {
            const r = await fetch(RECORDS_API);
            if (r.ok) {
                const j = await r.json();
                const customerCountDocs = (j.data || []).filter(d => d.type === 'customer_count').length;
                setCounter(base + customerCountDocs);
                localStorage.setItem(fallbackKey, String(base + customerCountDocs));
            }
        } catch (e) { /* ignore */ }
    }
})();