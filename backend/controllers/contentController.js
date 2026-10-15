import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createContentController(content,assistant){return {
    get:async(req,res)=>success(res,await content.get(req.params.slug)),
    publish:async(req,res)=>success(res,await content.publish(req.contentInput,context(req)),201),
    receipt:async(req,res)=>success(res,await content.receipt(req.params.orderId,context(req))),
    assistantMessage:async(req,res)=>success(res,await assistant.message(req.assistantInput,context(req))),
    assistantHandoff:async(req,res)=>success(res,await assistant.handoff(req.assistantInput,context(req)),201)
};}
