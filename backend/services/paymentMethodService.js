import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { cents, money } from './pricingMath.js';

const conflict = () => new ApiError('Método ou obrigação em conflito',409,null,'PAYMENT_CONFLICT');
const unavailable = () => ApiError.indisponivel();
const dto = row => ({id:idString(row.id_metodo),type:row.tipo,identification:row.identificacao,principal:Boolean(row.principal),provider:row.provider});
function tokenized(result) {
    if (!result || !/^[a-z0-9_-]{2,40}$/i.test(result.provider ?? '') ||
        !/^[\x21-\x7e]{8,255}$/.test(result.token ?? '') ||
        !/^[A-Za-z][A-Za-z ._-]{0,24}$/.test(result.brand ?? '') ||
        !/^\d{4}$/.test(result.last4 ?? '')) throw unavailable();
    return {...result,identification:`${result.brand} final ${result.last4}`};
}
export function createPaymentMethodService({model,identity,provider}) {
    const tx=(context,fn)=>identity.transaction(fn,context);
    async function actor(c,context) { const a=await identity.activeActor(c,context); if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado(); return a; }
    async function own(c,id,owner,lock=false) {
        const row=await model.method(id,c,lock);
        if(!row||!row.ativo||idString(row.id_usuario)!==idString(owner))throw ApiError.naoEncontrado();
        return row;
    }
    async function list(context) {return tx(context,async c=>{const a=await actor(c,context);return (await model.list(a.id_usuario,c)).map(dto);});}
    async function get(id,context) {return tx(context,async c=>{const a=await actor(c,context);return dto(await own(c,id,a.id_usuario));});}
    async function create(input,context) {
        // Provider fora do lock; setupReference é referência opaca de sessão hospedada.
        const owner=await tx(context,async c=>idString((await actor(c,context)).id_usuario));
        if(typeof provider?.tokenize!=='function')throw unavailable();
        const method=tokenized(await provider.tokenize({setupReference:input.setupReference,type:input.type,userId:owner,signal:context.signal}));
        return tx(context,async c=>{
            const a=await actor(c,context);
            await model.ownerMethods(a.id_usuario,c);
            const existing=await model.list(a.id_usuario,c);
            const principal=input.principal===true||existing.length===0;
            if(principal)await model.clearPrincipal(c,a.id_usuario);
            const id=await model.insert(c,a.id_usuario,input.type,method.identification,method.provider,method.token,principal);
            await identity.audit(c,'PAYMENT_METHOD.CREATED',id,context);
            return dto(await own(c,id,a.id_usuario));
        });
    }
    async function patch(id,input,context) {return tx(context,async c=>{
        const a=await actor(c,context);await model.ownerMethods(a.id_usuario,c);
        const row=await own(c,id,a.id_usuario,true);
        if(input.principal===true) {await model.clearPrincipal(c,a.id_usuario);await model.setPrincipal(c,id,true);}
        else if(row.principal)throw conflict();
        await identity.audit(c,'PAYMENT_METHOD.UPDATED',id,context);
        return dto(await own(c,id,a.id_usuario));
    });}
    async function remove(id,context) {return tx(context,async c=>{
        const a=await actor(c,context);await model.ownerMethods(a.id_usuario,c);
        await own(c,id,a.id_usuario,true);
        await model.archive(c,id);
        await identity.audit(c,'PAYMENT_METHOD.ARCHIVED',id,context);
    });}
    // Consumidor interno do checkout: somente prepara o registro durável. A tarefa 30
    // despacha ao gateway após commit e reconcilia respostas/webhooks.
    async function prepare(c,{orderId=null,chargeId=null,methodId,key,context}) {
        if(!c?.execute)throw new TypeError('Conexão transacional obrigatória');
        if(Boolean(orderId)===Boolean(chargeId))throw ApiError.validacao('Informe pedido ou cobrança');
        if(!/^[A-Za-z0-9._:-]{8,120}$/.test(key??''))throw ApiError.validacao('Chave de idempotência inválida');
        const a=await actor(c,context);
        const previous=await model.intention(a.id_usuario,key,c);
        if(previous){
            const matching=String(previous.id_pedido??'')===String(orderId??'') && String(previous.id_cobranca??'')===String(chargeId??'') && idString(previous.id_metodo)===idString(methodId);
            if(!matching)throw conflict();
            return {id:idString(previous.id_intencao),state:previous.estado,amount:String(previous.valor)};
        }
        const ref=orderId?await model.order(orderId,c):await model.charge(chargeId,c);
        if(!ref||idString(ref.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();
        const method=await own(c,methodId,a.id_usuario,true);
        if(!method.provider||!method.provider_token)throw conflict();
        const amount=orderId?ref.valor_total:money(cents(ref.valor_devido)+cents(ref.valor_multa_aplicada??'0.00'));
        if(cents(amount)<=0n||!['AGUARDANDO_PAGAMENTO','PENDENTE','ATRASADO'].includes(ref.status))throw conflict();
        const inserted=await model.insertIntention(c,{owner:a.id_usuario,key,orderId,chargeId,methodId,amount});
        const stored=await model.intention(a.id_usuario,key,c);
        if(idString(stored.id_metodo)!==idString(methodId)||String(stored.id_pedido??'')!==String(orderId??'')||String(stored.id_cobranca??'')!==String(chargeId??'')||String(stored.valor)!==amount)throw conflict();
        if(inserted.created)await identity.audit(c,'PAYMENT_INTENT.PREPARED',inserted.id,context);
        return {id:inserted.id,state:stored.estado,amount};
    }
    return {list,get,create,patch,remove,prepare};
}
