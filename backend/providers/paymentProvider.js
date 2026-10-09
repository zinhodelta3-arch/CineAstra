import { ApiError } from '../utils/ApiError.js';

// Contrato do adaptador real: tokenize({setupReference,type,userId,signal}) retorna
// {provider,token,brand,last4}; os demais métodos usam IDs opacos do gateway.
// O adaptador deve obter o token no gateway, nunca aceitar PAN/CVV nesta API.
export function unavailablePaymentProvider() {
    const unavailable = async () => { throw ApiError.indisponivel(); };
    return { name: null, available: false, tokenize: unavailable, create: unavailable, consult: unavailable,
        cancel: unavailable, refund: unavailable, verifyWebhook: unavailable };
}
