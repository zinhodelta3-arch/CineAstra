const MAX_UNSIGNED = 18446744073709551615n;
export function idString(value) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new TypeError('ID sem precisão segura');
    const text = String(value);
    if (!/^[1-9]\d{0,19}$/.test(text) || BigInt(text) > MAX_UNSIGNED) throw new TypeError('ID inválido');
    return text;
}
export function moneyString(value) {
    if (typeof value !== 'string' || !/^\d{1,8}\.\d{2}$/.test(value)) throw new TypeError('Dinheiro deve ser decimal exato');
    return value;
}
export function success(res, data, status = 200) {
    return res.status(status).json({ success: true, data, requestId: res.locals.requestId });
}
export function pagination(query) {
    const limit = query.limit ?? '20';
    if (!/^\d{1,3}$/.test(String(limit)) || Number(limit) < 1 || Number(limit) > 100 || (query.cursor !== undefined && (typeof query.cursor !== 'string' || query.cursor.length > 256))) throw new TypeError('Paginação inválida');
    return { limit: Number(limit), cursor: query.cursor ?? null };
}
