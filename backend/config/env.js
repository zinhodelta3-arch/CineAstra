import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { isIP } from 'node:net';

export function loadEnvironment() {
    dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
}

export function validateEnv(env = process.env) {
    const errors = new Set();
    const required = (key) => {
        const value = env[key];
        if (typeof value !== 'string' || !value.trim()) errors.add(key);
        return value;
    };
    const integer = (key, fallback, min, max) => {
        const text = env[key] ?? String(fallback);
        const value = Number(text);
        if (!/^\d+$/.test(String(text)) || !Number.isSafeInteger(value) || value < min || value > max) errors.add(key);
        return value;
    };
    const boolean = (key, fallback) => {
        const text = env[key] ?? String(fallback);
        if (!['true', 'false'].includes(text)) errors.add(key);
        return text === 'true';
    };
    const mode = env.NODE_ENV ?? 'development';
    if (!['development', 'test', 'staging', 'production'].includes(mode)) errors.add('NODE_ENV');
    const production = mode === 'production';
    const origins = (env.CORS_ORIGINS ?? (production ? '' : 'http://localhost:3000')).split(',').map(s => s.trim()).filter(Boolean);
    const validOrigin = value => {
        try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && u.origin === value && (!production || u.protocol === 'https:'); }
        catch { return false; }
    };
    if (!origins.length || origins.some(o => !validOrigin(o))) errors.add('CORS_ORIGINS');
    const secret = required('JWT_SECRET');
    if (secret && (Buffer.byteLength(secret) < 32 || /^(change|example|secret|senha|replace)/i.test(secret))) errors.add('JWT_SECRET');
    const docsEnabled = boolean('DOCS_ENABLED', !production);
    if (production && docsEnabled) errors.add('DOCS_ENABLED');
    const trustProxy = (env.TRUST_PROXY ?? '').split(',').map(s => s.trim()).filter(Boolean);
    // Endereços/subnets de proxies reais; nunca "true", contagem de hops ou redes globais.
    if (trustProxy.some(v => {
        const [address, prefix, extra] = v.split('/');
        const family = isIP(address);
        return !family || extra !== undefined || (prefix !== undefined && (!/^\d{1,3}$/.test(prefix) || Number(prefix) < 1 || Number(prefix) > (family === 4 ? 32 : 128)));
    })) errors.add('TRUST_PROXY');
    const instances = integer('INSTANCE_COUNT', 1, 1, 1000);
    const rateLimitStore = env.RATE_LIMIT_STORE ?? 'memory';
    if (!['memory', 'external'].includes(rateLimitStore) || (instances > 1 && rateLimitStore === 'memory')) errors.add('RATE_LIMIT_STORE');
    const retentionMode = env.LOG_RETENTION_MODE ?? 'event';
    if (!['event', 'worker'].includes(retentionMode)) errors.add('LOG_RETENTION_MODE');
    const publicOrigin = env.PUBLIC_ORIGIN ?? 'http://localhost:3001';
    if (!validOrigin(publicOrigin)) errors.add('PUBLIC_ORIGIN');
    const sampleRate = Number(env.LOG_SUCCESS_SAMPLE_RATE ?? 0.05);
    if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) errors.add('LOG_SUCCESS_SAMPLE_RATE');
    if ((env.CAPTCHA_PROVIDER ?? 'unavailable') !== 'unavailable') errors.add('CAPTCHA_PROVIDER');
    const encryptionKey = env.TWO_FACTOR_ENCRYPTION_KEY || null;
    if (encryptionKey && (!/^[A-Za-z0-9+/]{43}=$/.test(encryptionKey) || Buffer.from(encryptionKey, 'base64').length !== 32)) errors.add('TWO_FACTOR_ENCRYPTION_KEY');
    const config = {
        mode, production, docsEnabled, origins, trustProxy, publicOrigin, instances, rateLimitStore,
        host: env.HOST ?? '127.0.0.1', port: integer('PORT', 3001, 1, 65535),
        bodyLimit: integer('BODY_LIMIT_BYTES', 65536, 1024, 1048576),
        httpTimeout: integer('HTTP_TIMEOUT_MS', 10000, 100, 10000),
        shutdownTimeout: integer('SHUTDOWN_TIMEOUT_MS', 10000, 100, 30000),
        jwt: { secret, issuer: required('JWT_ISSUER'), audience: required('JWT_AUDIENCE'), ttl: integer('JWT_TTL_SECONDS', 900, 60, 900) },
        identity: { encryptionKey, bcryptCost: integer('BCRYPT_COST', 12, 10, 14), termsVersion: env.TERMS_VERSION || null, privacyVersion: env.PRIVACY_VERSION || null },
        db: { host: required('DB_HOST'), port: integer('DB_PORT', 3306, 1, 65535), user: required('DB_USER'), password: required('DB_PASSWORD'), database: required('DB_NAME'),
            connectionLimit: integer('DB_CONNECTION_LIMIT', 10, 1, 100), queueLimit: integer('DB_QUEUE_LIMIT', 100, 1, 1000), timeout: integer('DB_TIMEOUT_MS', 3000, 100, 5000) },
        rate: { max: integer('RATE_LIMIT_MAX', 120, 1, 10000), windowMs: integer('RATE_LIMIT_WINDOW_MS', 60000, 100, 3600000) },
        logging: { queueLimit: integer('LOG_QUEUE_LIMIT', 200, 1, 10000), sampleRate, retentionMode, purgeInterval: integer('LOG_PURGE_INTERVAL_MS', 900000, 60000, 3600000) }
    };
    if (config.db.database && !/^[a-zA-Z0-9_]+$/.test(config.db.database)) errors.add('DB_NAME');
    if (config.db.timeout >= config.httpTimeout) errors.add('DB_TIMEOUT_MS');
    if (errors.size) throw new Error(`Configuração inválida: ${[...errors].sort().join(', ')}`);
    return Object.freeze(config);
}
