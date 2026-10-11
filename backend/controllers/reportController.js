import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createReportController(service){return {
    finance:async(req,res)=>success(res,await service.finance(req.reportQuery,context(req))),
    social:async(req,res)=>success(res,await service.socialAllocation(req.reportQuery,context(req))),
    audit:async(req,res)=>success(res,await service.audit(req.reportQuery,context(req))),
    http:async(req,res)=>success(res,await service.http(req.reportQuery,context(req)))
};}
