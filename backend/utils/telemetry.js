// Lista positiva: nunca aceite message/stack/sql/URL/headers/body do erro.
export function report(event, { requestId, status, count } = {}) {
    console.error(JSON.stringify({ event, ...(requestId && { requestId }), ...(status && { status }), ...(count !== undefined && { count }) }));
}
