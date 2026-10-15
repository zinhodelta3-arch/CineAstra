import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=z.string().regex(/^[1-9]\d{0,19}$/).refine(value=>BigInt(value)<=18446744073709551615n);
export function streamingIdParam(req,res,next){if(!id.safeParse(req.params.accessId).success)throw ApiError.validacao('ID inválido');next();}
export function streamingFilmIdParam(req,res,next){if(!id.safeParse(req.params.filmId).success)throw ApiError.validacao('ID inválido');next();}
export function streamingPage(req,res,next){const parsed=z.object({limit:z.coerce.number().int().min(1).max(100).default(50),cursor:z.union([z.literal('0'),id]).default('0')}).strict().safeParse(req.query);if(!parsed.success)throw ApiError.validacao('Paginação inválida');req.streamingPage=parsed.data;next();}
