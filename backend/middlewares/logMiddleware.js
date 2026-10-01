import { create } from "../config/database.js";

/*
 * ============================================================
 * CONFIGURAÇÕES
 * ============================================================
 */

// Percentual dos GETs 2xx/3xx que será persistido.
// 0.05 = aproximadamente 5%.
// Em desenvolvimento, pode usar LOG_SUCCESS_SAMPLE_RATE=1.
const SUCCESS_SAMPLE_RATE = clamp(
    Number(process.env.LOG_SUCCESS_SAMPLE_RATE ?? 0.05),
    0,
    1
);

// Limite máximo do JSON armazenado em dados_requisicao.
const MAX_JSON_LOG_BYTES = 4096;

// Métodos que alteram estado do sistema devem ser registrados integralmente.
const ALWAYS_LOG_METHODS = new Set([
    "POST",
    "PUT",
    "PATCH",
    "DELETE"
]);

// Métodos que normalmente não agregam valor para persistência.
const IGNORED_METHODS = new Set([
    "OPTIONS",
    "HEAD"
]);

// Health checks saudáveis não precisam ocupar a tabela de logs.
// Caso retornem >= 400, serão registrados normalmente.
const IGNORED_ROUTES = new Set([
    "/health",
    "/healthz",
    "/ready",
    "/readyz"
]);

// Em endpoints sensíveis, não armazenamos o body nem em caso de erro.
const SENSITIVE_ROUTE_PATTERNS = [
    /\/login/i,
    /\/logout/i,
    /\/senha/i,
    /\/password/i,
    /\/2fa/i,
    /\/auth/i,
    /\/pagamento/i,
    /\/payment/i,
    /\/checkout/i,
    /\/cartao/i,
    /\/card/i
];

const SENSITIVE_FIELDS = new Set([
    "senha",
    "password",
    "token",
    "authorization",
    "access_token",
    "refresh_token",
    "client_secret",
    "secret",
    "chave",
    "codigo_2fa",
    "otp",
    "cvv",
    "cvc",
    "card_number",
    "numero_cartao",
    "pan"
]);

/*
 * ============================================================
 * MIDDLEWARE PRINCIPAL
 * ============================================================
 *
 * Deve ser registrado antes das rotas.
 *
 * O INSERT do log acontece depois que a resposta termina, então:
 * - status_code já está definido;
 * - authMiddleware já teve oportunidade de preencher req.usuario;
 * - o tempo real da requisição pode ser calculado.
 */
export const logMiddleware = (req, res, next) => {
    const startTime = process.hrtime.bigint();

    let alreadyLogged = false;

    const persistFinishedRequest = () => {
        // Evita duplicação caso `close` ocorra logo após `finish`.
        if (alreadyLogged) {
            return;
        }

        // finish = resposta enviada normalmente.
        // close sem writableFinished = conexão interrompida antes do fim.
        const wasAborted = !res.writableFinished;

        alreadyLogged = true;

        const elapsedMs = Number(
            process.hrtime.bigint() - startTime
        ) / 1_000_000;

        const statusCode = Number(res.statusCode) || 500;

        if (!shouldPersistLog(req, statusCode)) {
            return;
        }

        const idUsuario =
            req.usuario?.id_usuario ??
            req.usuario?.id ??
            null;

        const rota = normalizeRoute(req);

        const userAgent = (
            req.get("User-Agent") || ""
        ).slice(0, 512) || null;

        const contentLength = res.getHeader("Content-Length");

        const tamanhoRespostaBytes =
            Number.isFinite(Number(contentLength))
                ? Math.max(0, Number(contentLength))
                : null;

        const shouldCaptureRequestData =
            statusCode >= 400 &&
            !isSensitiveRoute(req.path || rota);

        const logData = {
            id_usuario: idUsuario,

            rota,
            metodo: String(req.method || "UNKNOWN").slice(0, 16),

            ip_address: getClientIp(req),
            user_agent: userAgent,

            status_code: statusCode,
            tempo_resposta_ms: Math.max(0, Math.round(elapsedMs)),
            tamanho_resposta_bytes: tamanhoRespostaBytes,

            data_hora: new Date(),

            dados_requisicao: shouldCaptureRequestData
                ? safeJson(buildRequestData(req))
                : null,

            // Nunca persistir o corpo da resposta.
            // Apenas metadados pequenos são mantidos.
            dados_resposta:
                statusCode >= 400
                    ? safeJson({
                        error: true,
                        status_code: statusCode,
                        content_type:
                            res.getHeader("Content-Type") || null,
                        aborted: wasAborted
                    })
                    : null
        };

        // O log nunca deve impedir ou atrasar a resposta ao cliente.
        void saveLog(logData);
    };

    res.once("finish", persistFinishedRequest);

    // Captura também conexões abortadas que não chegaram a emitir `finish`.
    res.once("close", () => {
        if (!res.writableFinished) {
            persistFinishedRequest();
        }
    });

    next();
};

/*
 * ============================================================
 * DECISÃO DE PERSISTÊNCIA
 * ============================================================
 */
function shouldPersistLog(req, statusCode) {
    // 4xx e 5xx são sempre registrados.
    if (statusCode >= 400) {
        return true;
    }

    // Não persistir OPTIONS e HEAD.
    if (IGNORED_METHODS.has(req.method)) {
        return false;
    }

    const route = normalizeRoute(req);

    // Health check saudável não precisa ir para o banco.
    if (IGNORED_ROUTES.has(route)) {
        return false;
    }

    // Operações de alteração de estado são registradas integralmente.
    if (ALWAYS_LOG_METHODS.has(req.method)) {
        return true;
    }

    // GET/3xx: amostragem configurável.
    return Math.random() < SUCCESS_SAMPLE_RATE;
}

/*
 * ============================================================
 * REQUEST
 * ============================================================
 */
function buildRequestData(req) {
    return {
        query:
            Object.keys(req.query || {}).length > 0
                ? sanitizeValue(req.query)
                : null,

        body:
            req.method !== "GET"
                ? sanitizeValue(req.body)
                : null
    };
}

/*
 * ============================================================
 * SANITIZAÇÃO RECURSIVA
 * ============================================================
 */
function sanitizeValue(value, depth = 0) {
    if (depth > 5) {
        return "[MAX_DEPTH]";
    }

    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === "string") {
        return value.length > 1000
            ? `${value.slice(0, 1000)}...[TRUNCATED]`
            : value;
    }

    if (
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return value;
    }

    if (Buffer.isBuffer(value)) {
        return "[BUFFER]";
    }

    if (Array.isArray(value)) {
        return value
            .slice(0, 50)
            .map(item => sanitizeValue(item, depth + 1));
    }

    if (typeof value === "object") {
        const sanitized = {};

        for (const [key, fieldValue] of Object.entries(value).slice(0, 50)) {
            const normalizedKey = key.toLowerCase();

            if (SENSITIVE_FIELDS.has(normalizedKey)) {
                sanitized[key] = "[REDACTED]";
                continue;
            }

            sanitized[key] = sanitizeValue(
                fieldValue,
                depth + 1
            );
        }

        return sanitized;
    }

    return "[UNSUPPORTED_VALUE]";
}

/*
 * ============================================================
 * LIMITAÇÃO DO JSON
 * ============================================================
 */
function safeJson(value) {
    try {
        const serialized = JSON.stringify(value);

        if (!serialized) {
            return null;
        }

        const size = Buffer.byteLength(
            serialized,
            "utf8"
        );

        if (size <= MAX_JSON_LOG_BYTES) {
            return serialized;
        }

        // Não truncar uma string JSON pela metade.
        return JSON.stringify({
            truncated: true,
            original_size_bytes: size
        });
    } catch (error) {
        return JSON.stringify({
            serialization_error: true
        });
    }
}

/*
 * ============================================================
 * ROTA / IP
 * ============================================================
 */
function normalizeRoute(req) {
    const rawRoute =
        req.path ||
        req.originalUrl ||
        "/";

    return String(rawRoute)
        .split("?")[0]
        .slice(0, 255) || "/";
}

function getClientIp(req) {
    return (
        req.ip ||
        req.socket?.remoteAddress ||
        null
    );
}

/*
 * ============================================================
 * ROTAS SENSÍVEIS
 * ============================================================
 */
function isSensitiveRoute(route) {
    return SENSITIVE_ROUTE_PATTERNS.some(
        pattern => pattern.test(route)
    );
}

/*
 * ============================================================
 * DATABASE
 * ============================================================
 */
async function saveLog(logData) {
    try {
        await create("logs", logData);
    } catch (error) {
        // Falha no logger não pode derrubar a requisição principal.
        console.error(
            "Erro ao inserir log no banco:",
            error
        );
    }
}

/*
 * ============================================================
 * LOG SIMPLES DE DESENVOLVIMENTO
 * ============================================================
 */
export const simpleLogMiddleware = (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
        const usuario = req.usuario?.id_usuario
            ? `[user:${req.usuario.id_usuario}]`
            : "[anonymous]";

        console.debug(
            `${new Date().toISOString()} ` +
            `${req.method} ` +
            `${req.originalUrl} ` +
            `${usuario}`
        );
    }

    next();
};

/*
 * ============================================================
 * UTIL
 * ============================================================
 */
function clamp(value, min, max) {
    return Math.min(
        Math.max(value, min),
        max
    );
}