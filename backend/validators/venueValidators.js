import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const limited = max => z.string().trim().min(1).max(max);
const localStatus = z.enum(['ATIVO', 'INATIVO', 'MANUTENCAO']);
const roomStatus = z.enum(['ATIVA', 'MANUTENCAO', 'INATIVA']);
const seatStatus = z.enum(['ATIVA', 'INATIVA']);
const roomType = z.enum(['2D', '3D', '4DX', 'VIP', 'IMAX']);
const seatType = z.enum(['COMUM', 'PCD', 'OBESO', 'IDOSO', 'CASAL']);
const localFields = {
    nome: limited(150), cidade: limited(100), estado: z.string().regex(/^[A-Z]{2}$/),
    cep: z.string().trim().max(10).nullable().optional(), logradouro: limited(150).nullable().optional(),
    numero: limited(20).nullable().optional(), complemento: limited(100).nullable().optional(),
    bairro: limited(100).nullable().optional(), telefone: limited(20).nullable().optional()
};
const roomFields = { nome: limited(100), capacidade: z.number().int().min(1).max(2147483647) };
const seatFields = { fileira: z.string().trim().regex(/^[A-Za-z0-9]{1,5}$/).transform(v => v.toUpperCase()), numero: z.number().int().min(1).max(2147483647) };
const local = z.object({ ...localFields, status: localStatus.default('ATIVO') }).strict();
const room = z.object({ ...roomFields, tipo: roomType.default('2D'), status: roomStatus.default('INATIVA') }).strict();
const seat = z.object({ ...seatFields, tipo: seatType.default('COMUM'), status: seatStatus.default('ATIVA') }).strict();
const patch = shape => z.object(shape).partial().strict().refine(v => Object.keys(v).length > 0);
const paging = { limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional() };
export const venueSchemas = {
    local, localPatch: patch({ ...localFields, status: localStatus }), room, roomPatch: patch({ ...roomFields, tipo: roomType, status: roomStatus }), seat, seatPatch: patch({ ...seatFields, tipo: seatType, status: seatStatus }),
    list: z.object(paging).strict(),
    adminLocals: z.object({ ...paging, status: z.enum(['ATIVO', 'INATIVO', 'MANUTENCAO']).optional() }).strict(),
    adminRooms: z.object({ ...paging, status: z.enum(['ATIVA', 'INATIVA', 'MANUTENCAO']).optional() }).strict(),
    seats: z.object({ ...paging, accessible: z.enum(['true', 'false']).transform(v => v === 'true').optional() }).strict(),
    adminSeats: z.object({ ...paging, accessible: z.enum(['true', 'false']).transform(v => v === 'true').optional(), status: z.enum(['ATIVA', 'INATIVA']).optional() }).strict()
};
export function venueQuery(schema) { return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) throw ApiError.validacao('Filtros ou paginação inválidos');
    req.venueQuery = parsed.data; next();
}; }
export function venueParams(req, res, next) {
    if (Object.values(req.params).some(v => !catalogId.safeParse(v).success)) throw ApiError.validacao('Identificador inválido');
    next();
}
