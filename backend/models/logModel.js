export function createLogModel(database) {
    return {
        async insert(log) {
            await database.execute(`INSERT INTO logs
                (id_usuario, rota, metodo, ip_address, user_agent, status_code, tempo_resposta_ms, tamanho_resposta_bytes, dados_requisicao, dados_resposta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
            [log.userId, log.route, log.method, log.ip, log.userAgent, log.status, log.elapsed, log.size]);
        },
        async checkRetention(mode, options) {
            await database.execute('SELECT id_log FROM logs LIMIT 0', [], options);
            const [[scheduler]] = await database.execute('SELECT @@global.event_scheduler AS scheduler', [], options);
            const [events] = await database.execute(`SELECT STATUS AS status, EVENT_DEFINITION AS definition, INTERVAL_VALUE AS interval_value, INTERVAL_FIELD AS interval_field
                FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE() AND EVENT_NAME = ?`, ['ev_logs_expurgo'], options);
            const event = events[0];
            const definition = event?.definition ?? '';
            const expectedEvent = /DELETE\s+FROM\s+`?logs`?/i.test(definition) && /INTERVAL\s+90\s+DAY/i.test(definition) && /LIMIT\s+5000/i.test(definition)
                && event.interval_field === 'MINUTE' && Number(event.interval_value) === 15;
            if (mode === 'event') return scheduler.scheduler === 'ON' && event?.status === 'ENABLED' && expectedEvent;
            // Recusa dois expurgos concorrentes ou evento habilitado que o DBA ainda não desligou.
            return !event || event.status !== 'ENABLED';
        },
        async purge() {
            const [result] = await database.execute(`DELETE FROM logs WHERE data_hora < UTC_TIMESTAMP(3) - INTERVAL 90 DAY ORDER BY data_hora ASC LIMIT 5000`);
            return result.affectedRows;
        }
    };
}
