import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {instant} from './identityService.js';

const ageLimit={L:0,'10':10,'12':12,'14':14,'16':16,'18':18};
const ageOn=(birth,on)=>{if(!birth)return -1;const b=String(birth).slice(0,10),d=String(on).slice(0,10);return Number(d.slice(0,4))-Number(b.slice(0,4))-(d.slice(5)<b.slice(5)?1:0);};
const conflict=message=>new ApiError(message,409,null,'STREAMING_CONFLICT');
const date=value=>value?new Date(instant(value)).toISOString():null;
const available=(row,now)=>['PAGO','FINALIZADO'].includes(row.pedido_status)&&row.status==='ATIVO'&&instant(row.data_inicio)<=now&&(!row.data_expiracao||instant(row.data_expiracao)>now);
const validItem=item=>['ALUGUEL','COMPRA'].includes(item.tipo_streaming)&&item.id_filme&&item.id_usuario&&
    (item.tipo_streaming==='COMPRA'||Number.isInteger(item.dias_acesso_aluguel_snapshot)&&item.dias_acesso_aluguel_snapshot>=1&&item.dias_acesso_aluguel_snapshot<=36500);
const dto=(row,now)=>({id:idString(row.id_acesso),itemId:idString(row.id_item),filmId:idString(row.id_filme),mode:row.tipo_streaming,status:row.status==='ATIVO'&&row.data_expiracao&&instant(row.data_expiracao)<=now?'EXPIRADO':row.status,available:available(row,now),startsAt:date(row.data_inicio),expiresAt:date(row.data_expiracao)});
const paid=status=>['PAGO','ISENTO'].includes(status);
const catalogBenefit=value=>{try{return (typeof value==='string'?JSON.parse(value):value)?.catalogAccess===true;}catch{return false;}};
export function createStreamingService({model,identity,provider}){
    async function actor(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return a;}
    async function checkAge(c,user,classification){
        const proof=await model.age(c,user.id_usuario);
        if(!proof||proof.faixa_etaria==='ATE_16'||ageOn(user.data_nascimento,new Date().toISOString().slice(0,10))<(ageLimit[classification]??Infinity))throw ApiError.acessoNegado();
    }
    async function canGrant(c,orderId){
        const items=await model.orderItems(c,orderId);
        return items.every(validItem);
    }
    async function ensureSellable(c,lines){
        if(!lines.some(line=>line.kind==='STREAMING'))return;
        ready();
        for(const line of lines.filter(x=>x.kind==='STREAMING')){
            const film=await model.sellableFilm(c,line.id);
            if(!film||film.status!=='ATIVO'||!film.disponivel_streaming||!film.url_reproducao)throw ApiError.indisponivel();
        }
    }
    async function grant(c,orderId,confirmedAt){
        const items=await model.orderItems(c,orderId);
        if(items.some(item=>!validItem(item)||!['PAGO','FINALIZADO'].includes(item.pedido_status)))throw conflict('Direito de streaming inconsistente');
        if(!items.length)return {created:0};
        const at=confirmedAt??(await model.clock(c))?.agora;
        if(!at||!Number.isFinite(instant(at)))throw ApiError.indisponivel();
        let created=0;
        for(const item of items){
            const existing=await model.existing(c,item.id_item);
            if(existing){if(idString(existing.id_usuario)!==idString(item.id_usuario)||idString(existing.id_filme)!==idString(item.id_filme)||existing.status!=='ATIVO')throw conflict('Direito existente incompatível');continue;}
            await model.grant(c,item,item.id_usuario,at);created++;
        }
        return {created};
    }
    async function list({limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const user=await actor(c,context),rows=await model.list(c,user.id_usuario,limit,cursor),page=rows.slice(0,limit),now=Date.now();
        return {items:page.map(row=>dto(row,now)),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_acesso):null}};
    },context);}
    async function checkedAccess(id,context){return identity.transaction(async c=>{
        const user=await actor(c,context),row=await model.owned(c,id,user.id_usuario);
        if(!row)throw ApiError.naoEncontrado();
        if(!available(row,Date.now()))throw ApiError.acessoNegado();
        await checkAge(c,user,row.classificacao);
        if(row.filme_status!=='ATIVO'||!row.disponivel_streaming||!row.url_reproducao)throw ApiError.indisponivel();
        return row;
    },context);}
    async function checkedPlanFilm(filmId,context){return identity.transaction(async c=>{
        const user=await actor(c,context),film=await model.planFilm(c,filmId);
        if(!film)throw ApiError.naoEncontrado();
        const today=new Date().toISOString().slice(0,10);
        const candidates=await model.planCandidates(c,user.id_usuario);
        const eligible=candidates.find(row=>{
            const owner=idString(row.id_usuario)===idString(user.id_usuario);
            if(row.status!=='ATIVA'||!row.inicio||!row.fim||row.inicio>today||row.fim<today||!catalogBenefit(row.contrato_snapshot))return false;
            if(!owner&&(row.participante_status!=='ATIVO'||Boolean(row.participante_suspenso)))return false;
            if(Boolean(row.suspenso_por_cobranca)&&(owner||row.tipo_divisao==='TITULAR_PAGA'))return false;
            return paid(owner||row.tipo_divisao==='TITULAR_PAGA'?row.cobranca_titular:row.cobranca_propria??row.cobranca_titular);
        });
        if(!eligible)throw ApiError.acessoNegado();
        await checkAge(c,user,film.classificacao);
        if(film.status!=='ATIVO'||!film.disponivel_streaming||!film.url_reproducao)throw ApiError.indisponivel();
        return {film,subscriptionId:idString(eligible.id_assinatura)};
    },context);}
    function ready(){if(provider?.available!==true||provider.privateOrigin!==true||typeof provider.sign!=='function'||!Array.isArray(provider.deliveryHosts)||!provider.deliveryHosts.length)throw ApiError.indisponivel();}
    function signedUrl(result){
        let url;try{url=new URL(result?.url);}catch{throw ApiError.indisponivel();}
        const expires=Date.parse(result?.expiresAt??'');
        if(url.protocol!=='https:'||url.username||url.password||!provider.deliveryHosts.includes(url.hostname.toLowerCase())||url.href.length>2048||!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+60000)throw ApiError.indisponivel();
        return {url:url.href,expiresAt:new Date(expires).toISOString()};
    }
    async function play(id,context){
        const row=await checkedAccess(id,context);
        ready();
        const result=await provider.sign({source:row.url_reproducao,accessId:idString(row.id_acesso),filmId:idString(row.id_filme),ttlSeconds:60,signal:context.signal});
        const signed=signedUrl(result);
        await checkedAccess(id,context);
        return {accessId:idString(row.id_acesso),...signed};
    }
    async function playWithPlan(filmId,context){
        const entitlement=await checkedPlanFilm(filmId,context);
        ready();
        const result=await provider.sign({source:entitlement.film.url_reproducao,subscriptionId:entitlement.subscriptionId,filmId:idString(filmId),ttlSeconds:60,signal:context.signal});
        const signed=signedUrl(result);
        const current=await checkedPlanFilm(filmId,context);
        if(current.subscriptionId!==entitlement.subscriptionId||current.film.url_reproducao!==entitlement.film.url_reproducao)throw ApiError.acessoNegado();
        return {filmId:idString(filmId),subscriptionId:entitlement.subscriptionId,...signed};
    }
    return {canGrant,ensureSellable,grant,list,play,playWithPlan};
}
