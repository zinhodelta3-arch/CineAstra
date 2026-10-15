import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createTicketController(service){return {
    owner:async(req,res)=>success(res,await service.ownerTickets(req.params.orderId,req.ticketPage,context(req))),
    session:async(req,res)=>success(res,await service.sessionTickets(req.params.sessionId,req.ticketPage,context(req))),
    attendance:async(req,res)=>success(res,await service.attendance(req.params.sessionId,req.ticketPage,context(req))),
    validate:async(req,res)=>success(res,await service.validate(req.input.code,context(req))),
    consume:async(req,res)=>success(res,await service.consume(req.input.code,req.input.halfEvidenceType,context(req))),
    exit:async(req,res)=>success(res,await service.exit(req.input.code,context(req))),
    entry:async(req,res)=>success(res,await service.entry(req.input.code,req.input.halfEvidenceType,context(req)))
};}
