import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createStreamingController(service){return {
    list:async(req,res)=>success(res,await service.list(req.streamingPage,context(req))),
    play:async(req,res)=>{res.set('Referrer-Policy','no-referrer');return success(res,await service.play(req.params.accessId,context(req)));},
    playWithPlan:async(req,res)=>{res.set('Referrer-Policy','no-referrer');return success(res,await service.playWithPlan(req.params.filmId,context(req)));}
};}
