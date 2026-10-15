import { loadEnvironment, validateEnv } from '../config/env.js';
import { createDatabase } from '../config/database.js';
import { createLogModel } from '../models/logModel.js';

loadEnvironment();
let database;
try {
    const config = validateEnv();
    if (config.production || process.env.DB_INSPECT_CONFIRMED_NON_PRODUCTION !== 'true') throw new Error('Alvo não confirmado');
    database = createDatabase(config.db);
    const [[version]] = await database.execute('SELECT VERSION() AS version, @@session.time_zone AS timezone');
    const [columns] = await database.execute(`SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type, EXTRA AS extra, GENERATION_EXPRESSION AS generated
        FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND (TABLE_NAME IN ('fornecedores','filmes','filmes_imagens','insumos_imagens','combos_imagens','logs') OR TABLE_NAME LIKE 'newsletter_%') ORDER BY TABLE_NAME, ORDINAL_POSITION`);
    let retention = false;
    try { retention = await createLogModel(database).checkRetention(config.logging.retentionMode); } catch { /* sem SQL no output */ }
    console.info(JSON.stringify({ version, columns, retentionReady: retention }, null, 2));
} catch { console.error('Inspeção indisponível: configure conexão não produtiva confirmada e permissão de leitura de metadados.'); process.exitCode = 1; }
finally { if (database) await database.close(); }
