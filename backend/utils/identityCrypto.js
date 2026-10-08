import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'node:crypto';
import bcrypt from 'bcryptjs';
import * as OTPAuth from 'otpauth';
import { ApiError } from './ApiError.js';

export const opaqueToken = () => randomBytes(32).toString('hex');
export const tokenHash = token => createHash('sha256').update(token).digest();
export const tokenHexHash = token => tokenHash(token).toString('hex');
export function passwordPolicy(password, confirmation) {
    if (typeof password !== 'string' || password !== confirmation || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^a-zA-Z0-9]/.test(password)) throw ApiError.validacao('Senha ou confirmação inválida', [{ field: 'password', code: 'PASSWORD_POLICY' }]);
}
export async function hashPassword(password, cost) { return bcrypt.hash(password, cost); }
export async function verifyPassword(password, hash) {
    if (typeof password !== 'string' || Buffer.byteLength(password) > 72 || !/^\$2[aby]\$\d{2}\$[./a-zA-Z0-9]{53}$/.test(hash ?? '')) return false;
    return bcrypt.compare(password, hash);
}
function keyFrom(value) {
    if (!value || Buffer.from(value, 'base64').length !== 32) throw ApiError.indisponivel();
    return Buffer.from(value, 'base64');
}
export function sealSecret(secret, key, userId) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', keyFrom(key), iv);
    cipher.setAAD(Buffer.from(`cineastra:2fa:${userId}`));
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join('.');
}
export function unsealSecret(value, key, userId) {
    try {
        const [version, iv, tag, text] = value.split('.');
        if (version !== 'v1') throw new Error('Legacy enrollment');
        const decipher = createDecipheriv('aes-256-gcm', keyFrom(key), Buffer.from(iv, 'base64'));
        decipher.setAAD(Buffer.from(`cineastra:2fa:${userId}`));
        decipher.setAuthTag(Buffer.from(tag, 'base64'));
        return Buffer.concat([decipher.update(Buffer.from(text, 'base64')), decipher.final()]).toString('utf8');
    } catch { throw ApiError.indisponivel(); }
}
export function newTotp(userId) {
    return new OTPAuth.TOTP({ issuer: 'CineAstra', label: `user-${userId}`, algorithm: 'SHA1', digits: 6, period: 30, secret: new OTPAuth.Secret({ size: 20 }) });
}
export function totpStep(secret, code, timestamp = Date.now()) {
    const totp = new OTPAuth.TOTP({ algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
    const delta = totp.validate({ token: code, timestamp, window: 1 });
    return delta === null ? null : BigInt(Math.floor(timestamp / 30000) + delta).toString();
}
