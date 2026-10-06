import { ApiError } from '../utils/ApiError.js';

export function createHealthService(database, retention, lifecycle) {
    return {
        live() { return { status: 'ok' }; },
        async ready({ signal } = {}) {
            if (lifecycle.stopping) throw ApiError.indisponivel();
            try {
                await database.ping({ signal });
                if (!await retention.check({ signal })) throw ApiError.indisponivel();
                if (lifecycle.stopping) throw ApiError.indisponivel();
                return { status: 'ready' };
            } catch { throw ApiError.indisponivel(); }
        }
    };
}
