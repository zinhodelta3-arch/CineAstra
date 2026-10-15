export function createNewsletterDeliveryController(service){return {
    bounce:async(req,res)=>{await service.bounce(req.params.provider,req.body,req.headers,{signal:req.signal});res.status(204).end();}
};}
