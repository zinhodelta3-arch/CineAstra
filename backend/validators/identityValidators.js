import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function validCpf(value) {
    if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
    for (let length = 9; length <= 10; length++) {
        let sum = 0;
        for (let i = 0; i < length; i++) sum += Number(value[i]) * (length + 1 - i);
        let digit = (sum * 10) % 11;
        if (digit === 10) digit = 0;
        if (digit !== Number(value[length])) return false;
    }
    return true;
}
const email = z.string().trim().toLowerCase().max(150).email();
const cpf = z.string().max(14).transform(v => v.replace(/[.-]/g, '')).refine(validCpf);
const id = z.string().regex(/^[1-9]\d{0,19}$/).refine(v => BigInt(v) <= 18446744073709551615n);
const token = z.string().regex(/^[a-f0-9]{64}$/);
const password = z.string().min(1).max(72).refine(v => Buffer.byteLength(v) <= 72);
const name = z.string().trim().min(2).max(100);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => Number.isFinite(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v && v <= new Date().toISOString().slice(0, 10));
const strict = shape => z.object(shape).strict();
const nonEmpty = schema => schema.refine(o => Object.keys(o).length > 0);
export const schemas = {
    register: strict({ name, email, cpf, dateOfBirth: date, password, passwordConfirmation: password, termsVersion: z.string().min(1).max(50), privacyVersion: z.string().min(1).max(50), acceptTerms: z.literal(true), acceptPrivacy: z.literal(true), ageProof: z.string().min(1).max(512), guardianProof: z.string().min(1).max(512).optional(), captchaToken: z.string().min(1).max(4096) }),
    login: strict({ email, password, captchaToken: z.string().min(1).max(4096) }),
    forgot: strict({ email, captchaToken: z.string().min(1).max(4096) }),
    reset: strict({ token, password, passwordConfirmation: password, captchaToken: z.string().min(1).max(4096) }),
    verify: strict({ challengeToken: token, code: z.string().regex(/^\d{6}$/) }),
    enroll: strict({ password: password.optional(), challengeToken: token.optional(), method: z.enum(['APP', 'SMS', 'EMAIL']) }).refine(o => Boolean(o.password) !== Boolean(o.challengeToken)),
    factorDisable: strict({ password, code: z.string().regex(/^\d{6}$/) }),
    profile: nonEmpty(strict({ name: name.optional(), phone: z.string().regex(/^\+?[\d ()-]{8,20}$/).nullable().optional(), email: email.optional(), currentPassword: password.optional(), password: password.optional(), passwordConfirmation: password.optional() })),
    reauthenticate: strict({ password, code: z.string().regex(/^\d{6}$/).optional() }),
    address: strict({ cep: z.string().regex(/^\d{5}-?\d{3}$/).optional(), logradouro: z.string().trim().min(1).max(150), numero: z.string().trim().min(1).max(20), complemento: z.string().trim().max(100).nullable().optional(), bairro: z.string().trim().max(100).optional(), cidade: z.string().trim().min(1).max(100), estado: z.string().regex(/^[A-Z]{2}$/), principal: z.boolean().default(false) }),
    contact: strict({ tipo: z.enum(['TELEFONE', 'WHATSAPP', 'EMAIL_SECUNDARIO']), valor: z.string().trim().min(3).max(150), principal: z.boolean().default(false) }).refine(v => v.tipo === 'EMAIL_SECUNDARIO' ? z.email().safeParse(v.valor).success : /^\+?[\d ()-]{8,20}$/.test(v.valor)),
    preferences: nonEmpty(strict({ tema: z.enum(['CLARO', 'ESCURO', 'SISTEMA']).optional(), tamanho_fonte: z.enum(['PEQUENO', 'MEDIO', 'GRANDE', 'MUITO_GRANDE']).optional(), alto_contraste: z.boolean().optional(), modo_acessibilidade: z.boolean().optional(), idioma: z.literal('pt-BR').optional(), aparencia: z.enum(['cineastra', 'violet-bloom', 'mocha-mousse', 'catppucin']).optional() })),
    adminUser: strict({ name, email, cpf, dateOfBirth: date, password, passwordConfirmation: password, role: z.enum(['CLIENTE', 'FORNECEDOR', 'SUPERVISOR', 'COLABORADOR', 'ADMIN']) }),
    accessChange: nonEmpty(strict({ role: z.enum(['CLIENTE', 'FORNECEDOR', 'SUPERVISOR', 'COLABORADOR', 'ADMIN']).optional(), status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO']).optional() })),
    parental: nonEmpty(strict({ compras_permitidas: z.boolean().optional(), assinaturas_permitidas: z.boolean().optional(), limite_minutos_diarios: z.number().int().min(1).max(1440).optional() })),
    authorizeMinor: strict({ purpose: z.enum(['COMPRA', 'ASSINATURA']), operationReference: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/), expiresAt: z.iso.datetime() }),
    params: strict({ id })
};
schemas.addressPatch = nonEmpty(schemas.address.partial());
schemas.contactPatch = nonEmpty(strict({ valor: z.string().trim().min(3).max(150).optional(), principal: z.boolean().optional() }));
export function validateBody(schema) {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) throw ApiError.validacao('Entrada inválida', parsed.error.issues.map(issue => ({ field: issue.path.join('.') || 'body', code: 'INVALID_VALUE' })));
        req.input = parsed.data; next();
    };
}
export function validateId(req, res, next) {
    if (!id.safeParse(req.params.id).success) throw ApiError.validacao('Identificador inválido');
    next();
}
