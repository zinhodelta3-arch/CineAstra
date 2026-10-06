import mysql from 'mysql2/promise';
import { ApiError } from '../utils/ApiError.js';
import { report } from '../utils/telemetry.js';

export function poolOptions(config) {
    return { host: config.host, port: config.port, user: config.user, password: config.password, database: config.database,
        waitForConnections: true, connectionLimit: config.connectionLimit, queueLimit: config.queueLimit,
        connectTimeout: config.timeout, enableKeepAlive: true, timezone: 'Z', dateStrings: true,
        supportBigNumbers: true, bigNumberStrings: true, decimalNumbers: false, multipleStatements: false,
        charset: 'utf8mb4', flags: '-LOCAL_FILES', maxPreparedStatements: 100 };
}

export function createDatabase(config, suppliedPool) {
    const pool = suppliedPool ?? mysql.createPool(poolOptions(config));
    let closed = false;
    async function acquire() {
        if (closed) throw ApiError.indisponivel();
        let expired = false;
        let timer;
        const pending = pool.getConnection().then(connection => {
            if (expired) { connection.release(); throw ApiError.indisponivel(); }
            return connection;
        });
        try {
            return await Promise.race([pending, new Promise((_, reject) => {
                timer = setTimeout(() => { expired = true; reject(ApiError.indisponivel()); }, config.timeout);
            })]);
        } catch { throw ApiError.indisponivel(); }
        finally { clearTimeout(timer); }
    }
    async function withConnection(operation, { signal } = {}) {
        if (signal?.aborted) throw ApiError.indisponivel();
        const raw = await acquire();
        let destroyed = false;
        const destroy = () => { if (!destroyed) { destroyed = true; raw.destroy(); } };
        let rejectDeadline;
        const deadline = new Promise((_, reject) => { rejectDeadline = reject; });
        const abort = () => { destroy(); rejectDeadline(ApiError.indisponivel()); };
        signal?.addEventListener('abort', abort, { once: true });
        // Deadline total: cancela socket MySQL e rejeita também um callback que nunca conclui.
        const timer = setTimeout(abort, config.timeout);
        const execute = async (sql, params = []) => {
            if (destroyed || signal?.aborted) throw ApiError.indisponivel();
            try { return await raw.execute(sql, params); }
            catch (error) { if (destroyed) throw ApiError.indisponivel(); throw error; }
        };
        try {
            return await Promise.race([deadline, (async () => {
                await execute("SET SESSION time_zone = '+00:00'");
                if (signal?.aborted) throw ApiError.indisponivel();
                const result = await operation({ execute });
                if (destroyed) throw ApiError.indisponivel();
                return result;
            })()]);
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', abort);
            if (!destroyed) raw.release();
        }
    }
    const execute = (sql, params = [], options) => withConnection(c => c.execute(sql, params), options);
    async function transaction(operation, options) {
        return withConnection(async connection => {
            await connection.execute('START TRANSACTION');
            try {
                const result = await operation(connection);
                await connection.execute('COMMIT');
                return result;
            } catch (error) {
                try { await connection.execute('ROLLBACK'); }
                catch { report('transaction_rollback_failed'); }
                throw error;
            }
        }, options);
    }
    return {
        execute, transaction, withConnection,
        async ping(options) { await execute('SELECT 1 AS ok', [], options); },
        async close() { if (!closed) { closed = true; await pool.end(); } }
    };
}
