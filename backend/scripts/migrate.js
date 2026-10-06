import { pathToFileURL } from 'node:url';
import { loadEnvironment, validateEnv } from '../config/env.js';
import { createDatabase } from '../config/database.js';
import { migrationPlan } from './migrationPlan.js';

export async function applyPlan(database, plan) {
    return database.withConnection(async connection => {
        const [[lock]] = await connection.execute("SELECT GET_LOCK(CONCAT(DATABASE(), ':cineastra:migrate'), 0) AS acquired");
        if (Number(lock.acquired) !== 1) throw new Error('Migration em execução');
        try {
            const [tables] = await connection.execute('SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()');
            const names = tables.map(t => t.name);
            if (names.length && !names.includes('schema_migrations')) throw new Error('Base existente sem ledger: baseline/inspeção manual obrigatório, nenhuma migration aplicada');
            await connection.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
                name VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
                checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
                status ENUM('RUNNING','APPLIED') NOT NULL,
                applied_at DATETIME(3) NULL
            ) ENGINE=InnoDB`);
            const [records] = await connection.execute('SELECT name, checksum, status FROM schema_migrations');
            if (!records.length && names.some(n => n !== 'schema_migrations')) throw new Error('Ledger vazio em base existente: baseline manual obrigatório');
            const known = new Map(plan.map(p => [p.name, p]));
            for (const record of records) {
                if (!known.has(record.name) || known.get(record.name).checksum !== record.checksum || record.status !== 'APPLIED') throw new Error('Histórico divergente ou DDL interrompido: inspecione antes de continuar, sem retry automático');
            }
            const applied = new Set(records.map(r => r.name));
            for (const step of plan) {
                if (applied.has(step.name)) continue;
                // Marker persistido ANTES do DDL com commit implícito. Falha/crash bloqueia retry.
                await connection.execute('INSERT INTO schema_migrations (name, checksum, status) VALUES (?, ?, ?)', [step.name, step.checksum, 'RUNNING']);
                await connection.execute(step.sql);
                await connection.execute("UPDATE schema_migrations SET status = 'APPLIED', applied_at = UTC_TIMESTAMP(3) WHERE name = ?", [step.name]);
            }
        } finally { await connection.execute("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':cineastra:migrate'))"); }
    });
}

async function main() {
    const plan = await migrationPlan();
    if (!process.argv.includes('--apply')) {
        console.info(JSON.stringify({ mode: 'plan-only', statements: plan.map(({ name, checksum }) => ({ name, checksum })), excluded: ['database creation/USE', 'seeds antigos', 'SELECTs de referência', 'DROP/CREATE EVENT (DBA)', 'recomendações comentadas'] }, null, 2));
        return;
    }
    loadEnvironment();
    const config = validateEnv();
    if (config.production || !['development', 'test', 'staging'].includes(config.mode) || process.env.MIGRATION_CONFIRMED_NON_PRODUCTION !== 'true' || process.env.MIGRATION_TARGET !== config.db.database) throw new Error('Migration exige alvo não produtivo confirmado explicitamente');
    // Runner de implantação tem prazo total distinto do pool HTTP; mantém limites finitos.
    const database = createDatabase({ ...config.db, timeout: 30000 });
    try { await applyPlan(database, plan); console.info('Plano aplicado. Verifique retenção de logs e metadados antes de iniciar.'); }
    finally { await database.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    try { await main(); }
    catch { console.error('Migration não concluída. Verifique configuração, alvo, ledger e DDL parcial; erro SQL não exposto.'); process.exitCode = 1; }
}
