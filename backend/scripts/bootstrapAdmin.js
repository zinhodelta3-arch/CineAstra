import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { loadEnvironment, validateEnv } from '../config/env.js';
import { createDatabase } from '../config/database.js';
import { createIdentityModel } from '../models/identityModel.js';
import { recordAuditEvent } from '../models/auditModel.js';
import { schemas } from '../validators/identityValidators.js';
import { passwordPolicy, hashPassword } from '../utils/identityCrypto.js';

export async function bootstrapAdmin(database, config, input) {
    const data = schemas.adminUser.parse({ ...input, role: 'ADMIN' });
    passwordPolicy(data.password, data.passwordConfirmation);
    const hash = await hashPassword(data.password, config.identity.bcryptCost);
    const model = createIdentityModel(database);
    return database.transaction(async c => {
        await model.adminGuard(c);
        const [[row]] = await c.execute("SELECT COUNT(*) AS total FROM usuarios WHERE tipo_usuario = 'ADMIN'");
        if (Number(row.total) !== 0) throw new Error('Bootstrap indisponível: administrador existente');
        const id = await model.createUser(c, { ...data, hash, status: 'ATIVO' });
        await recordAuditEvent(c, { eventId: randomUUID(), requestId: randomUUID(), actorId: null, aggregateId: id, type: 'IDENTITY.ADMIN_BOOTSTRAPPED', version: 1, occurredAt: new Date().toISOString() });
        return id;
    });
}
async function main() {
    let db;
    try {
        loadEnvironment();
        if (!process.argv.includes('--apply') || process.env.BOOTSTRAP_ADMIN_CONFIRMED !== 'true') throw new Error('Confirmação local ausente');
        const config = validateEnv();
        let body = '';
        for await (const chunk of process.stdin) { body += chunk; if (Buffer.byteLength(body) > 8192) throw new Error('Entrada excessiva'); }
        const input = JSON.parse(body);
        db = createDatabase(config.db);
        await bootstrapAdmin(db, config, input);
        console.info('Primeiro administrador criado. Login exige enrollment e prova 2FA.');
    } catch { console.error('Bootstrap não concluído. Confira configuração, entrada segura, migrations e ausência de ADMIN.'); process.exitCode = 1; }
    finally { await db?.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
