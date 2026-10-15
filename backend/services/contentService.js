import {createHash} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';

const unavailable=()=>new ApiError('Conteúdo contratual oficial ainda não publicado',503,null,'CONTENT_UNAVAILABLE');
const parse=value=>typeof value==='string'?JSON.parse(value):value;
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const iso=value=>{const text=String(value);return new Date(text.includes('T')?text:`${text.replace(' ','T')}Z`).toISOString();};
const publicDto=row=>({slug:row.slug,version:row.versao,title:row.titulo,body:parse(row.corpo),source:row.fonte,publishedAt:iso(row.publicado_em)});
export function createContentService({model,identity}){
    async function get(c,slug){const row=await model.current(c,slug);if(!row)throw ApiError.naoEncontrado();return publicDto(row);}
    async function wrap(c,input,offer){
        const rows=await Promise.all(['business','terms','privacy'].map(slug=>model.current(c,slug)));
        if(rows.some(row=>!row))throw unavailable();
        const [business,terms,privacy]=rows.map(publicDto);
        const summary={business,terms,privacy,offer};
        return {...summary,offerHash:hash({input,summary})};
    }
    async function contract(c,input,quote){return wrap(c,{localId:input.localId??null,lines:input.lines,couponCode:input.couponCode??null},{lines:quote.lines,total:quote.total,fees:quote.fees??'0.00',currency:'BRL',paymentPath:'/api/payments',paymentMethodsPath:'/api/users/me/payment-methods',conditions:'Reserva por 15 minutos; confirmação depende da aprovação do pagamento.'});}
    async function planContract(c,input,plan,price){return wrap(c,{planId:input.planId,period:input.period,autoRenew:input.autoRenew,divisionMode:input.divisionMode??'TITULAR_PAGA'},{lines:[{kind:'PLAN',plan}],total:price,fees:'0.00',currency:'BRL',paymentPath:'/api/payments',paymentMethodsPath:'/api/users/me/payment-methods',conditions:'Assinatura pendente até aprovação do pagamento; renovações e rateio conforme condições do plano.'});}
    return {
        get:slug=>identity.transaction(c=>get(c,slug)),
        async publish(input,context){return identity.transaction(async c=>{const actor=await identity.activeActor(c,context);if(actor.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();let id;try{id=await model.publish(c,input,actor.id_usuario);}catch(error){if(error.code==='ER_DUP_ENTRY')throw new ApiError('Versão já publicada',409,null,'CONTENT_VERSION_EXISTS');throw error;}await identity.audit(c,'CONTENT.PUBLISHED',id,context);return {id,slug:input.slug,version:input.version};},context);},
        preview:(input,quote)=>identity.transaction(c=>contract(c,input,quote)),
        contract,
        planContract,
        save:(c,orderId,offerHash,snapshot)=>model.saveContract(c,orderId,offerHash,snapshot),
        async receipt(orderId,context){return identity.transaction(async c=>{const actor=await identity.activeActor(c,context);if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();const row=await model.ownContract(c,orderId,actor.id_usuario);if(!row)throw ApiError.naoEncontrado();return {orderId:idString(orderId),offerHash:row.oferta_hash,acceptedAt:iso(row.aceito_em),contract:parse(row.contrato_snapshot)};},context);}
    };
}
