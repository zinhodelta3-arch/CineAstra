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
import { unavailableIdentityProviders } from './providers/identityProviders.js';
import { createIdentityModel } from './models/identityModel.js';
import { createIdentityService } from './services/identityService.js';
import { createProfileService } from './services/profileService.js';
import { createIdentityController } from './controllers/identityController.js';
import { identityRoutes } from './routes/identityRoutes.js';
import { createCatalogModel } from './models/catalogModel.js';
import { createCatalogService } from './services/catalogService.js';
import { createCatalogController } from './controllers/catalogController.js';
import { catalogRoutes } from './routes/catalogRoutes.js';
import { createImageStorage } from './models/imageStorage.js';
import { createImageUploadService } from './services/imageUploadService.js';
import { createImageUploadController } from './controllers/imageUploadController.js';
import { imageUploadRoutes } from './routes/imageUploadRoutes.js';

const specification = JSON.parse(readFileSync(new URL('./docs/openapi.json', import.meta.url), 'utf8'));

export function createApp({ config, database, logQueue, retention, sessionProvider, storeFactory, identityModel, identityProviders = unavailableIdentityProviders(), captchaProvider = unavailableCaptchaProvider(), lifecycle = { stopping: false }, registerRoutes }) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', config.trustProxy.length ? config.trustProxy : false);
    app.set('json replacer', (key, value) => typeof value === 'bigint' ? value.toString() : value);
    const limits = createLimits(config, storeFactory);
    const tokens = createJwt(config.jwt);
    const identity = createIdentityService({ database, model: identityModel ?? createIdentityModel(database), config, tokens, providers: identityProviders });
    const profile = createProfileService({ identity, config, providers: identityProviders });
    const auth = createAuthMiddleware(tokens, createAccessService(createUserAccessModel(database), sessionProvider ?? identity.sessionProvider));
    const dependencies = { auth, limits: limits.flows, captcha: captchaProvider };
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
    if (config.docsEnabled && !config.production) {
        const spec = { ...specification, servers: [{ url: config.publicOrigin }] };
        app.get('/openapi.json', (req, res) => { res.set('Cache-Control', 'no-store'); res.json(spec); });
        // Ajuste CSP apenas nesta UI; nenhuma lib externa, não relaxar API global.
        app.use('/api-docs', helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], upgradeInsecureRequests: null } }),
            (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); },
            swaggerUi.serveFiles(spec, { swaggerOptions: { persistAuthorization: false, validatorUrl: null } }),
            swaggerUi.setup(spec, { swaggerOptions: { persistAuthorization: false, validatorUrl: null }, customSiteTitle: 'CineAstra API' }));
    }
    app.use(identityRoutes(createIdentityController(identity, profile), dependencies));
    app.use(catalogRoutes(createCatalogController(createCatalogService({ model: createCatalogModel(database), identity, mediaHosts: config.catalog?.mediaHosts ?? [] })), dependencies));
    app.use(imageUploadRoutes(createImageUploadController(createImageUploadService({
        storage: createImageStorage(config.imageUpload),
        authorize: context => identity.transaction(async c => {
            if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
        }, context)
    })), dependencies));
    // Ponto de composição para módulos futuros e fixtures explícitas de testes.
    registerRoutes?.(app, dependencies);
    app.use((req, res, next) => next(ApiError.naoEncontrado()));
    app.use(errorMiddleware);
    return app;
}
export default createApp;
