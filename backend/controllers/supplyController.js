import { success } from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createSupplyController(service){return {
    stock:async(req,res)=>success(res,await service.stock(req.supplyQuery,context(req))),
    requests:async(req,res)=>success(res,await service.requests(req.supplyQuery,context(req))),
    request:async(req,res)=>success(res,await service.request(req.params.id,context(req))),
    createRequest:async(req,res)=>success(res,await service.createRequest(req.input,context(req)),201),
    approve:async(req,res)=>success(res,await service.decide(req.params.id,'APROVADA',context(req))),
    refuse:async(req,res)=>success(res,await service.decide(req.params.id,'RECUSADA',context(req))),
    shipments:async(req,res)=>success(res,await service.shipments(req.supplyQuery,context(req))),
    shipment:async(req,res)=>success(res,await service.shipment(req.params.id,context(req))),
    send:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'send',context(req))),
    transit:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'transit',context(req))),
    receive:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'receive',context(req))),
    returnEquipment:async(req,res)=>success(res,await service.returnEquipment(req.params.id,context(req))),
    cancel:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'cancel',context(req)))
};}
