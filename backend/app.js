import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { ApiError } from './utils/ApiError.js';
import { requestId, deadline } from './middlewares/requestMiddleware.js';
import { logMiddleware } from './middlewares/logMiddleware.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { createAuthMiddleware } from './middlewares/authMiddleware.js';
import { createLimits } from './middlewares/rateLimitMiddleware.js';
import { createJwt } from './config/jwt.js';
import { createAccessService } from './services/accessService.js';
import { createUserAccessModel } from './models/userAccessModel.js';
import { createHealthService } from './services/healthService.js';
import { createHealthController } from './controllers/healthController.js';
import { infrastructureRoutes } from './routes/infrastructureRoutes.js';
import { unavailableCaptchaProvider } from './providers/captchaProvider.js';

const specification = JSON.parse(readFileSync(new URL('./docs/openapi.json', import.meta.url), 'utf8'));

export function createApp({ config, database, logQueue, retention, sessionProvider, storeFactory, lifecycle = { stopping: false }, registerRoutes }) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', config.trustProxy.length ? config.trustProxy : false);
    app.set('json replacer', (key, value) => typeof value === 'bigint' ? value.toString() : value);
    const limits = createLimits(config, storeFactory);
    const tokens = createJwt(config.jwt);
    const auth = createAuthMiddleware(tokens, createAccessService(createUserAccessModel(database), sessionProvider));
    const dependencies = { auth, limits: limits.flows, captcha: unavailableCaptchaProvider() };
    app.locals.close = () => limits.close();
    app.use(requestId);
    app.use(logMiddleware(logQueue, { sampleRate: config.logging.sampleRate }));
    app.use(helmet());
    app.use(deadline(config.httpTimeout));
    app.use(limits.general);
    app.use(cors({ origin(origin, cb) {
        if (!origin || config.origins.includes(origin)) cb(null, true);
        else cb(new ApiError('Origem não permitida', 403, null, 'CORS_DENIED'));
    }, methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'], exposedHeaders: ['X-Request-Id', 'Retry-After'], credentials: false, maxAge: 600 }));
    app.use(express.json({ limit: config.bodyLimit, strict: true, inflate: false }));
    app.use(express.urlencoded({ limit: config.bodyLimit, extended: false, parameterLimit: 50, inflate: false }));
    app.use(infrastructureRoutes(createHealthController(createHealthService(database, retention, lifecycle))));
    if (config.docsEnabled) {
        const spec = { ...specification, servers: [{ url: config.publicOrigin }] };
        app.get('/openapi.json', (req, res) => { res.set('Cache-Control', 'no-store'); res.json(spec); });
        // Ajuste CSP apenas nesta UI; nenhuma lib externa, não relaxar API global.
        app.use('/api-docs', helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], upgradeInsecureRequests: null } }),
            (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); },
            swaggerUi.serveFiles(spec, { swaggerOptions: { persistAuthorization: false, validatorUrl: null } }),
            swaggerUi.setup(spec, { swaggerOptions: { persistAuthorization: false, validatorUrl: null }, customSiteTitle: 'CineAstra API' }));
    }
    // Único ponto de composição para módulos futuros e fixtures explícitas de testes.
    registerRoutes?.(app, dependencies);
    app.use((req, res, next) => next(ApiError.naoEncontrado()));
    app.use(errorMiddleware);
    return app;
}
export default createApp;
