import { randomBytes } from 'node:crypto';
import { validateEnv } from '../config/env.js';
import { createApp } from '../app.js';
import { createLogQueue } from '../services/logService.js';

export function testEnvironment(overrides = {}) {
    // Credenciais fictícias SOMENTE teste isolado; nenhum banco conectado por esta fixture.
    return { NODE_ENV: 'test', JWT_SECRET: randomBytes(48).toString('hex'), JWT_ISSUER: 'cineastra-test', JWT_AUDIENCE: 'test-client',
        DB_HOST: '127.0.0.1', DB_USER: 'unit_fixture', DB_PASSWORD: 'unit_fixture_only', DB_NAME: 'unit_fixture_test', ...overrides };
}
export function fixture(options = {}) {
    const config = { ...validateEnv(testEnvironment()), ...options.config };
    const logs = [];
    const logQueue = createLogQueue(async log => { logs.push(log); }, { limit: 100, reportFailure() {} });
    const database = options.database ?? { async execute() { return [[{ id_usuario: '1', tipo_usuario: 'CLIENTE', status: 'ATIVO' }]]; }, async ping() {} };
    const retention = options.retention ?? { async check() { return true; } };
    const sessionProvider = options.sessionProvider ?? { async verifyActive({ userId }) { return { userId, expiresAt: new Date(Date.now() + 60000).toISOString(), revoked: false, twoFactorVerified: true }; } };
    const app = createApp({ config, database, logQueue, retention, sessionProvider, lifecycle: options.lifecycle, registerRoutes: options.registerRoutes });
    return { app, config, database, logQueue, logs };
}
