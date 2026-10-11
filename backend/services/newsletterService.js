import {createHash,randomBytes} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';
import {instant} from './identityService.js';

export const newsletterTerms={version:'2026-10-10-v1',text:'Aceito receber por e-mail somente as categorias selecionadas. Posso cancelar a inscrição a qualquer momento.'};
const accepted={accepted:true,message:'Se a inscrição puder ser iniciada, enviaremos um link de confirmação para o e-mail informado.'};
const authorizationAccepted={accepted:true,message:'Se houver uma inscrição elegível, enviaremos um link para o e-mail informado.'};
const invalidToken=()=>ApiError.validacao('Link de confirmação inválido ou expirado');
const tokenPair=()=>{const token=randomBytes(32).toString('hex');return {token,hash:createHash('sha256').update(Buffer.from(token,'hex')).digest()};};
const hashOf=token=>createHash('sha256').update(Buffer.from(token,'hex')).digest();
export function createNewsletterService({database,model,emailProvider,terms=newsletterTerms}){
    async function authorized(c,token,purpose,allowed){
        const hash=hashOf(token),owner=await model.tokenOwner(c,hash);
        if(!owner)throw invalidToken();
        const subscriber=await model.subscriber(c,owner.id_inscrito);
        const record=await model.lockedToken(c,owner.id_inscrito,hash);
        if(!subscriber||!allowed.includes(subscriber.status)||!record||record.finalidade!==purpose||record.utilizado_em||!(instant(record.expira_em)>Date.now()))throw invalidToken();
        return {subscriber,record};
    }
    async function selectedCategories(c,codes){
        if(!Array.isArray(codes)||new Set(codes).size!==codes.length)throw ApiError.validacao('Categorias inválidas');
        const categories=await model.categories(c),selected=categories.filter(x=>codes.includes(x.codigo));
        if(selected.length!==codes.length)throw ApiError.validacao('Categoria indisponível');
        return selected;
    }
    return {
    async options(){return database.withConnection(async c=>({terms, categories:(await model.categories(c)).map(x=>({code:x.codigo,name:x.nome,description:x.descricao}))}));},
    async subscribe(input,context={}){
        await emailProvider.assertAvailable();
        if(input.accepted!==true||!Array.isArray(input.categories)||!input.categories.length||new Set(input.categories).size!==input.categories.length)throw ApiError.validacao('Aceite e categorias obrigatórios');
        if(input.termsVersion!==terms.version)throw ApiError.validacao('Versão do consentimento desatualizada');
        const email=input.email.trim().toLowerCase(),{token,hash}=tokenPair();
        let created=false;
        try{await database.transaction(async c=>{
            const selected=await selectedCategories(c,input.categories);
            if(await model.byEmail(c,email))return;
            const id=await model.insert(c,{email,name:input.name,version:terms.version});
            for(const category of selected)await model.preference(c,id,category.id_categoria);
            await model.token(c,id,hash);
            created=true;
        },{signal:context.signal});}
        catch(error){if(error.code==='ER_DUP_ENTRY')return accepted;throw error;}
        if(created)await emailProvider.sendConfirmation({email,token,expiresIn:86400,signal:context.signal});
        return accepted;
    },
    async confirm(token,context={}){
        const hash=hashOf(token);
        return database.transaction(async c=>{
            const owner=await model.tokenOwner(c,hash);
            if(!owner)throw invalidToken();
            const subscriber=await model.subscriber(c,owner.id_inscrito);
            const record=await model.lockedToken(c,owner.id_inscrito,hash);
            if(!subscriber||subscriber.status!=='PENDENTE'||!record||record.finalidade!=='CONFIRMACAO'||record.utilizado_em||!(instant(record.expira_em)>Date.now()))throw invalidToken();
            await model.useToken(c,record.id_token);
            await model.activate(c,owner.id_inscrito);
            await model.invalidateOther(c,owner.id_inscrito,record.id_token);
            return {confirmed:true};
        },{signal:context.signal});
    },
    async requestAuthorization({email,purpose},context={}){
        await emailProvider.assertAvailable();
        if(!['GESTAO','DESCADASTRO'].includes(purpose))throw ApiError.validacao('Finalidade inválida');
        const normalized=email.trim().toLowerCase(),{token,hash}=tokenPair();
        let shouldSend=false;
        await database.transaction(async c=>{
            const subscriber=await model.byEmail(c,normalized);
            if(!subscriber||purpose==='DESCADASTRO'&&!['ATIVO','PENDENTE'].includes(subscriber.status)||purpose==='GESTAO'&&!['ATIVO','DESCADASTRADO'].includes(subscriber.status))return;
            await model.authorizationToken(c,subscriber.id_inscrito,purpose,hash);
            shouldSend=true;
        },{signal:context.signal});
        if(shouldSend)await emailProvider.sendAuthorization({email:normalized,token,purpose,expiresIn:1800,signal:context.signal});
        return authorizationAccepted;
    },
    async viewPreferences(token,context={}){return database.transaction(async c=>{
        const {subscriber}=await authorized(c,token,'GESTAO',['ATIVO','DESCADASTRADO']);
        const rows=await model.preferences(c,subscriber.id_inscrito);
        return {status:subscriber.status,categories:rows.map(x=>({code:x.codigo,name:x.nome,accepted:subscriber.status==='ATIVO'&&Boolean(x.aceita)}))};
    },{signal:context.signal});},
    async changePreferences({token,categories},context={}){return database.transaction(async c=>{
        const {subscriber,record}=await authorized(c,token,'GESTAO',['ATIVO']);
        const selected=await selectedCategories(c,categories);
        await model.resetPreferences(c,subscriber.id_inscrito);
        for(const category of selected)await model.acceptPreference(c,subscriber.id_inscrito,category.id_categoria);
        await model.cancelDisallowed(c,subscriber.id_inscrito);
        await model.useToken(c,record.id_token);
        return {updated:true};
    },{signal:context.signal});},
    async unsubscribe(token,context={}){return database.transaction(async c=>{
        const {subscriber}=await authorized(c,token,'DESCADASTRO',['ATIVO','PENDENTE']);
        await model.unsubscribe(c,subscriber.id_inscrito);
        await model.cancelQueue(c,subscriber.id_inscrito);
        await model.invalidateTokens(c,subscriber.id_inscrito);
        return {unsubscribed:true};
    },{signal:context.signal});},
    async resubscribe(input,context={}){
        await emailProvider.assertAvailable();
        if(input.accepted!==true||input.termsVersion!==terms.version||!input.categories?.length)throw ApiError.validacao('Novo aceite obrigatório');
        const {token,hash}=tokenPair();let email;
        await database.transaction(async c=>{
            const {subscriber}=await authorized(c,input.token,'GESTAO',['DESCADASTRADO']);
            if(await model.suppressed(c,subscriber.id_inscrito))throw ApiError.validacao('Endereço bloqueado para entrega');
            const selected=await selectedCategories(c,input.categories);
            await model.invalidateTokens(c,subscriber.id_inscrito);
            await model.restart(c,subscriber.id_inscrito,terms.version);
            await model.resetPreferences(c,subscriber.id_inscrito);
            for(const category of selected)await model.acceptPreference(c,subscriber.id_inscrito,category.id_categoria);
            await model.token(c,subscriber.id_inscrito,hash);
            email=subscriber.email;
        },{signal:context.signal});
        await emailProvider.sendConfirmation({email,token,expiresIn:86400,signal:context.signal});
        return {pending:true};
    }
};}
