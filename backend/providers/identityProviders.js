import { ApiError } from '../utils/ApiError.js';

// Somente contratos; default nunca marca e-mail entregue, idade verificada ou vínculo legal.
export function unavailableIdentityProviders() {
    const unavailable = async () => { throw ApiError.indisponivel(); };
    return {
        email: { async assertAvailable() { await unavailable(); }, sendRecovery: unavailable },
        age: { verify: unavailable },
        guardian: { verify: unavailable },
        factors: { SMS: { assertAvailable: unavailable, send: unavailable }, EMAIL: { assertAvailable: unavailable, send: unavailable } }
    };
}
