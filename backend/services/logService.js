import { report } from '../utils/telemetry.js';

export function createLogQueue(write, { limit = 200, reportFailure = report } = {}) {
    const queue = [];
    const metrics = { written: 0, failed: 0, dropped: 0 };
    let active = false;
    let accepting = true;
    let task = Promise.resolve();
    async function run() {
        active = true;
        try {
            while (queue.length) {
                const item = queue.shift();
                try { await write(item); metrics.written++; }
                catch { metrics.failed++; reportFailure('http_log_write_failed', { count: metrics.failed }); }
            }
        } finally { active = false; }
    }
    return {
        enqueue(item) {
            if (!accepting || queue.length + Number(active) >= limit) {
                metrics.dropped++;
                if (metrics.dropped === 1 || metrics.dropped % 100 === 0) reportFailure('http_log_queue_full', { count: metrics.dropped });
                return false;
            }
            queue.push(item);
            if (!active) task = run();
            return true;
        },
        stats() { return { ...metrics, pending: queue.length + Number(active) }; },
        async drain() { await task; },
        async close() { accepting = false; await task; }
    };
}
