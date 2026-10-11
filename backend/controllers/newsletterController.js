import {success} from '../utils/dto.js';
export function createNewsletterController(service){return {
    options:async(req,res)=>success(res,await service.options()),
    subscribe:async(req,res)=>success(res,await service.subscribe(req.newsletterInput,{signal:req.signal}),202),
    confirm:async(req,res)=>success(res,await service.confirm(req.newsletterInput.token,{signal:req.signal})),
    authorization:async(req,res)=>success(res,await service.requestAuthorization(req.newsletterInput,{signal:req.signal}),202),
    preferences:async(req,res)=>success(res,await service.viewPreferences(req.newsletterInput.token,{signal:req.signal})),
    changePreferences:async(req,res)=>success(res,await service.changePreferences(req.newsletterInput,{signal:req.signal})),
    unsubscribe:async(req,res)=>success(res,await service.unsubscribe(req.newsletterInput.token,{signal:req.signal})),
    resubscribe:async(req,res)=>success(res,await service.resubscribe(req.newsletterInput,{signal:req.signal}),202)
};}
