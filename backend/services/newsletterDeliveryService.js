import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';

export function createNewsletterDeliveryService({database,model,provider,maxAttempts=5,leaseSeconds=300}){
    if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>20||!Number.isInteger(leaseSeconds)||leaseSeconds<60)throw new Error('Configuração de entrega inválida');
    async function ready(){
        if(provider?.available===false||typeof provider?.assertAvailable!=='function'||typeof provider?.sendCampaign!=='function')throw ApiError.indisponivel();
        await provider.assertAvailable();
    }
    async function runOnce(){
        await ready();
        await database.withConnection(async c=>{await model.activateDue(c);await model.expireLeases(c,maxAttempts,leaseSeconds);});
        const claimed=await database.transaction(async c=>{
            const row=await model.next(c,maxAttempts,leaseSeconds);
            if(!row)return null;
            await model.markClaim(c,row.id_envio);
            return {id:idString(row.id_envio),attempt:Number(row.tentativas)+1};
        });
        if(!claimed){await database.withConnection(c=>model.complete(c,maxAttempts));return {state:'EMPTY'};}
        const message=await database.withConnection(c=>model.delivery(c,claimed.id,claimed.attempt));
        if(!message){
            await database.withConnection(c=>model.cancel(c,claimed.id,claimed.attempt));
            await database.withConnection(c=>model.complete(c,maxAttempts));
            return {state:'CANCELLED',id:claimed.id};
        }
        let receipt;
        try{
            receipt=await provider.sendCampaign({email:message.email,subject:message.assunto,html:message.conteudo_html,text:message.conteudo_texto,idempotencyKey:claimed.id,sendId:claimed.id,signal:AbortSignal.timeout(60_000)});
            if(receipt?.accepted!==true||receipt.messageId!==undefined&&receipt.messageId!==null&&(typeof receipt.messageId!=='string'||receipt.messageId.length>255))throw ApiError.indisponivel();
        }catch{
            await database.withConnection(c=>model.failed(c,claimed.id,claimed.attempt));
            await database.withConnection(c=>model.complete(c,maxAttempts));
            return {state:'FAILED',id:claimed.id};
        }
        const [result]=await database.withConnection(c=>model.sent(c,claimed.id,claimed.attempt,receipt.messageId??null));
        await database.withConnection(c=>model.complete(c,maxAttempts));
        return {state:result.affectedRows===1?'SENT':'RECLAIMED',id:claimed.id};
    }
    async function runBatch(limit=20){
        if(!Number.isInteger(limit)||limit<1||limit>100)throw new Error('Lote inválido');
        const states=[];
        for(let i=0;i<limit;i++){
            const result=await runOnce();
            if(result.state==='EMPTY')break;
            states.push(result.state);
        }
        return {claimed:states.length,sent:states.filter(x=>x==='SENT').length,failed:states.filter(x=>x==='FAILED').length};
    }
    async function bounce(name,rawBody,headers,context={}){
        if(provider?.available===false||typeof provider?.verifyBounce!=='function'||name!==provider.name)throw ApiError.naoEncontrado();
        if(!Buffer.isBuffer(rawBody)||rawBody.length<1||rawBody.length>65536)throw ApiError.validacao('Webhook inválido');
        const event=await provider.verifyBounce({rawBody,headers,signal:context.signal});
        if(event?.verified!==true||!['BOUNCE','COMPLAINT'].includes(event.type)||typeof event.email!=='string'||event.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.email)||typeof event.eventId!=='string'||event.eventId.length<1||event.eventId.length>255)throw ApiError.naoAutorizado();
        return database.transaction(async c=>{
            const subscriber=await model.subscriberByEmail(c,event.email.trim().toLowerCase());
            if(!subscriber)return {blocked:true};
            await model.suppress(c,subscriber.id_inscrito,event.type,event.eventId);
            await model.blockActive(c,subscriber.id_inscrito);
            await model.cancelSubscriberQueue(c,subscriber.id_inscrito);
            return {blocked:true};
        },{signal:context.signal});
    }
    return {runOnce,runBatch,bounce};
}
