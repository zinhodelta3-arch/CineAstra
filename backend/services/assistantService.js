import {ApiError} from '../utils/ApiError.js';
import {unavailableAssistantProvider} from '../providers/assistantProvider.js';

export function createAssistantService({identity,support,provider=unavailableAssistantProvider}){
    async function client(context){return identity.transaction(async c=>{const actor=await identity.activeActor(c,context);if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();},context);}
    return {
        async message(input,context){
            await client(context);
            const handoffPath='/api/assistant/handoff';
            if(provider.available!==true)return {identity:'IA',available:false,message:'Assistente indisponível. Encaminhe sua dúvida ao suporte humano.',handoffPath};
            // Somente texto da dúvida: sem identidade, histórico, SQL, ferramentas ou operações financeiras.
            try{const answer=await provider.answer({message:input.message});
                if(typeof answer!=='string'||!answer.trim()||answer.length>4000)throw new Error('Resposta inválida');
                return {identity:'IA',available:true,message:answer,handoffPath};
            }catch{return {identity:'IA',available:false,message:'Assistente indisponível. Encaminhe sua dúvida ao suporte humano.',handoffPath};}
        },
        handoff:(input,context)=>support.create({subject:'Encaminhamento da IA',message:input.message},context)
    };
}
