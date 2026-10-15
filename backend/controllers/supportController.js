import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createSupportController(service){return {
    create:async(req,res)=>success(res,await service.create(req.supportInput,context(req)),201),
    ownList:async(req,res)=>success(res,await service.ownList(req.supportPage,context(req))),
    adminQueue:async(req,res)=>success(res,await service.adminQueue(req.supportPage,context(req))),
    get:async(req,res)=>success(res,await service.get(req.params.id,context(req))),
    messages:async(req,res)=>success(res,await service.messages(req.params.id,req.supportPage,context(req))),
    message:async(req,res)=>success(res,await service.message(req.params.id,req.supportInput,context(req)),201),
    assign:async(req,res)=>success(res,await service.assign(req.params.id,req.supportInput.attendantId,context(req))),
    startLive:async(req,res)=>success(res,await service.startLive(req.params.id,context(req))),
    endLive:async(req,res)=>success(res,await service.endLive(req.params.id,context(req))),
    resolve:async(req,res)=>success(res,await service.resolve(req.params.id,context(req))),
    close:async(req,res)=>success(res,await service.close(req.params.id,context(req)))
};}
