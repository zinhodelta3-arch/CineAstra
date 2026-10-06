import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { idString } from '../utils/dto.js';

export function createJwt(config) {
    return {
        signAccess({ userId, sessionId }) {
            return jwt.sign({ sid: idString(sessionId), jti: randomUUID(), purpose: 'access' }, config.secret,
                { algorithm: 'HS256', issuer: config.issuer, audience: config.audience, subject: idString(userId), expiresIn: config.ttl });
        },
        verify(token) {
            const claims = jwt.verify(token, config.secret, { algorithms: ['HS256'], issuer: config.issuer, audience: config.audience, maxAge: config.ttl });
            if (typeof claims !== 'object' || claims.purpose !== 'access' || !Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) || claims.iat > Math.floor(Date.now() / 1000) + 5 || claims.exp - claims.iat > config.ttl || typeof claims.jti !== 'string' || claims.jti.length > 100) throw new Error('Invalid claims');
            idString(claims.sub); idString(claims.sid);
            return claims;
        }
    };
}
