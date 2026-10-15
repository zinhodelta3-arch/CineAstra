import { idString } from '../utils/dto.js';

export async function recordAuditEvent(connection, event) {
    if (!connection?.execute) throw new TypeError('Conexão transacional necessária');
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(event.eventId) || !uuid.test(event.requestId) || !/^[A-Z][A-Z0-9_.]{0,79}$/.test(event.type) || !Number.isSafeInteger(event.version) || event.version < 1) throw new TypeError('Evento inválido');
    const date = new Date(event.occurredAt);
    if (!Number.isFinite(date.getTime())) throw new TypeError('Instante inválido');
    const aggregateId = idString(event.aggregateId);
    const actorId = event.actorId == null ? null : idString(event.actorId);
    await connection.execute(`INSERT INTO auditoria_eventos (event_id, id_usuario, aggregate_id, event_type, occurred_at, version, request_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [event.eventId, actorId, aggregateId, event.type, date.toISOString().replace('T', ' ').replace('Z', ''), event.version, event.requestId]);
    // Payload mínimo positivo: nenhum body/token/CPF/valor externo arbitrário.
    await connection.execute('INSERT INTO outbox_eventos (event_id, payload) VALUES (?, ?)', [event.eventId, JSON.stringify({ eventId: event.eventId, aggregateId, type: event.type, version: event.version })]);
}
