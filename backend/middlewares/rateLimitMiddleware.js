import { createHash } from 'node:crypto';
import { rateLimit, ipKeyGenerator, MemoryStore } from 'express-rate-limit';
import { ApiError } from '../utils/ApiError.js';

export function createLimits(config, storeFactory) {
    if (config.rateLimitStore === 'external' && !storeFactory) throw new Error('Store compartilhado de rate limit não configurado');
    const stores = [];
    const limiter = (name, max, keyGenerator) => {
        const store = config.rateLimitStore === 'external' ? storeFactory(name) : new MemoryStore();
        if (!store) throw new Error('Store compartilhado de rate limit não configurado');
        stores.push(store);
        return rateLimit({ windowMs: config.rate.windowMs, limit: max, standardHeaders: 'draft-8', legacyHeaders: false,
            store, ...(keyGenerator && { keyGenerator }),
            handler: (req, res, next) => next(new ApiError('Limite de requisições excedido', 429, null, 'RATE_LIMITED')) });
    };
    const ip = req => ipKeyGenerator(req.ip);
    const identity = req => {
        const challenge = typeof req.body?.challengeToken === 'string' && /^[a-f0-9]{64}$/.test(req.body.challengeToken) ? req.body.challengeToken : null;
        const key = req.usuario?.id ?? (typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : challenge ?? 'anonymous');
        return createHash('sha256').update(key).digest('hex');
    };
    const flows = {};
    for (const [name, max] of Object.entries({ login: 10, register: 10, recovery: 5, twoFactor: 10, checkout: 20, tickets: 30, upload: 10, newsletter: 5 })) {
        flows[name] = [limiter(`${name}:ip`, max, ip), limiter(`${name}:identity`, max, identity)];
    }
    return { general: limiter('general', config.rate.max, ip), flows,
        async close() { await Promise.all(stores.map(s => s.shutdown?.())); } };
}
