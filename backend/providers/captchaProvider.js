import { ApiError } from '../utils/ApiError.js';

export function unavailableCaptchaProvider() {
    return { async verify() { throw ApiError.indisponivel(); } };
}
export function requireCaptcha(provider) {
    return async (req, res, next) => {
        const token = req.body?.captchaToken;
        if (typeof token !== 'string' || token.length < 1 || token.length > 4096) throw new ApiError('CAPTCHA necessário', 422, null, 'CAPTCHA_REQUIRED');
        if (await provider.verify({ token, ip: req.ip, signal: req.signal }) !== true) throw new ApiError('CAPTCHA inválido', 422, null, 'CAPTCHA_INVALID');
        next();
    };
}
