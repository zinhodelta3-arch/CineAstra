import { randomUUID } from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';

export function requestId(req, res, next) {
    // Gerado no servidor: não ecoar valores controlados pelo cliente nos logs.
    res.locals.requestId = randomUUID();
    req.requestId = res.locals.requestId;
    res.set('X-Request-Id', req.requestId);
    next();
}
export function deadline(timeout) {
    return (req, res, next) => {
        const controller = new AbortController();
        // Node 24 expõe signal por getter somente de leitura no IncomingMessage.
        Object.defineProperty(req, 'signal', { value: controller.signal, configurable: true });
        const timer = setTimeout(() => {
            controller.abort();
            if (!res.headersSent) next(new ApiError('Tempo de execução excedido', 503, null, 'DEPENDENCY_UNAVAILABLE'));
            else res.destroy();
        }, timeout);
        timer.unref();
        const clear = () => { clearTimeout(timer); controller.abort(); };
        res.once('finish', clear);
        res.once('close', clear);
        next();
    };
}
