import { idString } from '../utils/dto.js';

export function redactRoute(req) {
    // Nunca persistir URL bruta, parâmetros reais, query ou token. Só template de rota registrada.
    if (typeof req.route?.path === 'string') return req.route.path.slice(0, 255);
    return '[unmatched-or-middleware]';
}
export function logMiddleware(queue, { sampleRate = 0.05 } = {}) {
    return (req, res, next) => {
        const start = process.hrtime.bigint();
        let recorded = false;
        const persist = () => {
            if (recorded) return;
            recorded = true;
            const aborted = !res.writableFinished;
            const status = aborted ? 499 : res.statusCode;
            if (status < 400 && (['HEAD', 'OPTIONS'].includes(req.method) || ['/health', '/ready'].includes(req.route?.path))) return;
            if (status < 400 && req.method === 'GET' && Math.random() >= sampleRate) return;
            const size = res.getHeader('Content-Length');
            let userId = null;
            try { if (req.usuario?.id) userId = idString(req.usuario.id); } catch { /* não persistir identidade inválida */ }
            queue.enqueue({ userId, route: redactRoute(req), method: req.method.slice(0, 16), ip: req.ip?.slice(0, 45) ?? null,
                // User-Agent é controlado pelo cliente e pode transportar segredos; omissão intencional.
                userAgent: null, status, elapsed: Math.min(4294967295, Math.round(Number(process.hrtime.bigint() - start) / 1e6)),
                size: size !== undefined && /^\d+$/.test(String(size)) && Number(size) <= 4294967295 ? Number(size) : null });
        };
        res.once('finish', persist);
        res.once('close', persist);
        next();
    };
}
