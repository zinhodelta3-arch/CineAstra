export class ApiError extends Error {
    constructor(message, statusCode = 500, details = null, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
    static validacao(message = 'Entrada inválida', details = null) { return new ApiError(message, 422, details, 'VALIDATION_ERROR'); }
    static naoEncontrado() { return new ApiError('Recurso não encontrado', 404, null, 'NOT_FOUND'); }
    static naoAutorizado() { return new ApiError('Autenticação necessária ou inválida', 401, null, 'UNAUTHENTICATED'); }
    static acessoNegado() { return new ApiError('Acesso negado', 403, null, 'FORBIDDEN'); }
    static erroInterno() { return new ApiError('Erro interno do servidor', 500); }
    static indisponivel() { return new ApiError('Dependência indisponível', 503, null, 'DEPENDENCY_UNAVAILABLE'); }
    toJSON(requestId) {
        const safeDetails = Array.isArray(this.details) ? this.details
            .filter(d => d && /^[a-zA-Z0-9_.-]{1,80}$/.test(d.field) && /^[A-Z_]{1,50}$/.test(d.code))
            .map(d => ({ field: d.field, code: d.code })).slice(0, 20) : [];
        return { success: false, code: this.code, message: this.statusCode >= 500 ? (this.statusCode === 503 ? 'Dependência indisponível' : 'Erro interno do servidor') : this.message,
            requestId, ...(safeDetails.length && { details: safeDetails }) };
    }
}
