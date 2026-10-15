import { success } from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createOrderController(service,checkout,contracts){return {
    status:async(req,res)=>success(res,await service.status(req.params.orderId,context(req))),
    quote:async(req,res)=>{const quote=await service.quote(req.input,context(req));return success(res,contracts?{...quote,contract:await contracts.preview(req.input,quote)}:quote);},
    checkout:async(req,res)=>success(res,await checkout.checkout(req.input,req.paymentKey,context(req)),201),
    cancel:async(req,res)=>success(res,await checkout.cancel(req.params.orderId,req.paymentKey,context(req)))
};}
