import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message,409,null,'SUPPLY_CONFLICT');
const same = (a,b) => idString(a) === idString(b);
const itemKind = r => r.id_insumo ? 'input' : 'equipment';
const itemId = r => r.id_insumo ?? r.id_equipamento;
const requestDto = r => ({id_solicitacao:idString(r.id_solicitacao),id_usuario:idString(r.id_usuario),id_local:idString(r.id_local),id_sessao:r.id_sessao===null?null:idString(r.id_sessao),id_insumo:r.id_insumo===null?null:idString(r.id_insumo),id_equipamento:r.id_equipamento===null?null:idString(r.id_equipamento),quantidade:r.quantidade,status:r.status,observacao:r.observacao??null,data_solicitacao:r.data_solicitacao});
const shipmentDto = r => ({id_logistica:idString(r.id_logistica),id_fornecedor:idString(r.id_fornecedor),id_local_origem:r.id_local_origem==null?null:idString(r.id_local_origem),id_local_destino:idString(r.id_local_destino),id_solicitacao:r.id_solicitacao==null?null:idString(r.id_solicitacao),id_insumo_origem:r.id_insumo_origem==null?null:idString(r.id_insumo_origem),id_equipamento_origem:r.id_equipamento_origem==null?null:idString(r.id_equipamento_origem),id_insumo_destino:r.id_insumo_destino==null?null:idString(r.id_insumo_destino),quantidade:r.quantidade,status:r.status,data_envio:r.data_envio??null,data_prevista:r.data_prevista??null,data_recebimento:r.data_recebimento??null,data_devolucao:r.data_devolucao??null,id_usuario_recebimento:r.id_usuario_recebimento==null?null:idString(r.id_usuario_recebimento),id_usuario_devolucao:r.id_usuario_devolucao==null?null:idString(r.id_usuario_devolucao),observacao:r.observacao??null});
const page = (rows,q,dto,key) => { const items=rows.slice(0,q.limit);return {items:items.map(dto),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(items.at(-1)[key]):null}}; };
export function createSupplyService({model,identity}) {
    async function actor(c,context) { const a=await identity.activeActor(c,context);return {id:idString(a.id_usuario),role:a.tipo_usuario}; }
    async function staff(c,a,sessionId,localId,allowEnded=false) {
        if(a.role==='ADMIN')return;
        if(!['SUPERVISOR','COLABORADOR'].includes(a.role)||!sessionId)throw ApiError.acessoNegado();
        const session=found(await model.session(sessionId,c));
        if(!same(session.id_local,localId)||!(allowEnded?['AGENDADA','EM_CARTAZ','ENCERRADA']:['AGENDADA','EM_CARTAZ']).includes(session.status)||session.local_status!=='ATIVO'||!await model.member(a.id,sessionId,c))throw ApiError.acessoNegado();
    }
    async function supplier(c,a,id) {
        if(a.role==='ADMIN')return;
        if(a.role!=='FORNECEDOR')throw ApiError.acessoNegado();
        const own=found(await model.supplierByUser(a.id,c));
        if(own.status!=='ATIVO'||!same(own.id_fornecedor,id))throw ApiError.acessoNegado();
    }
    async function grant(c,supplierId,localId) {
        const g=found(await model.grant(supplierId,localId,c));
        if(g.supplier_status!=='ATIVO'||g.user_status!=='ATIVO'||g.tipo_usuario!=='FORNECEDOR'||g.grant_status!=='ATIVO'||g.local_status!=='ATIVO')throw conflict('Fornecedor ou local indisponível');
    }
    async function visibleRequest(c,a,r) {
        if(a.role==='ADMIN'||same(r.id_usuario,a.id))return;
        if(a.role==='FORNECEDOR') { const item=found(await model.item(itemKind(r),itemId(r),c));await supplier(c,a,item.id_fornecedor);return; }
        await staff(c,a,r.id_sessao,r.id_local,true);
    }
    const tx=(context,work)=>identity.transaction(async c=>work(c,await actor(c,context)),context);
    return {
        async stock(q,context) { return tx(context,async(c,a)=>{
            if(a.role!=='ADMIN')await staff(c,a,q.sessionId,q.localId,true);
            const local=found(await model.local(q.localId,c));if(local.status!=='ATIVO')throw conflict('Local indisponível');
            const stock=await model.stock(q.localId,c),incoming=await model.incoming(q.localId,c);
            return {id_local:q.localId,inputs:stock.inputs.map(r=>({id_insumo:idString(r.id),id_fornecedor:idString(r.id_fornecedor),nome:r.nome,quantidade:r.quantidade,disponivel:r.status==='DISPONIVEL'?r.quantidade-r.quantidade_reservada:0,status:r.status==='DISPONIVEL'&&r.quantidade-r.quantidade_reservada>0?'EM_ESTOQUE':'SEM_ESTOQUE'})),equipment:stock.equipment.map(r=>({id_equipamento:idString(r.id),id_fornecedor:idString(r.id_fornecedor),nome:r.nome,quantidade:r.quantidade,status:r.status==='DISPONIVEL'&&r.quantidade>0?'EM_ESTOQUE':'SEM_ESTOQUE'})),a_chegar:incoming.map(r=>({id_logistica:idString(r.id_logistica),id_insumo:r.id_insumo_origem==null?null:idString(r.id_insumo_origem),id_equipamento:r.id_equipamento_origem==null?null:idString(r.id_equipamento_origem),nome:r.nome,quantidade:r.quantidade,status:r.status}))};
        }); },
        async requests(q,context) { return tx(context,async(c,a)=>{if(!['ADMIN','SUPERVISOR','COLABORADOR','FORNECEDOR'].includes(a.role))throw ApiError.acessoNegado();if(a.role==='FORNECEDOR'){const own=found(await model.supplierByUser(a.id,c));if(own.status!=='ATIVO')throw ApiError.acessoNegado();q.supplierId=idString(own.id_fornecedor);}if(['SUPERVISOR','COLABORADOR'].includes(a.role)){if(q.sessionId){if(!q.localId)throw ApiError.validacao('localId obrigatório');await staff(c,a,q.sessionId,q.localId,true);}else q.userId=a.id;}return page(await model.listRequests(q,c),q,requestDto,'id_solicitacao');}); },
        async request(id,context) { return tx(context,async(c,a)=>{const r=found(await model.request(id,c));await visibleRequest(c,a,r);return requestDto(r);}); },
        async createRequest(input,context) { return tx(context,async(c,a)=>{
            if(!['ADMIN','SUPERVISOR','COLABORADOR'].includes(a.role))throw ApiError.acessoNegado();
            const local=found(await model.local(input.localId,c));if(local.status!=='ATIVO')throw conflict('Local indisponível');
            await staff(c,a,input.sessionId,input.localId);
            if(input.sessionId){const s=found(await model.session(input.sessionId,c));if(!same(s.id_local,input.localId)||!['AGENDADA','EM_CARTAZ'].includes(s.status))throw conflict('Sessão incompatível');}
            const kind=input.inputId?'input':'equipment', item=found(await model.item(kind,input.inputId??input.equipmentId,c));
            if(item.status!=='DISPONIVEL')throw conflict('Item indisponível');
            await grant(c,item.id_fornecedor,item.id_local);await grant(c,item.id_fornecedor,input.localId);
            const id=await model.createRequest(c,{...input,actorId:a.id});await identity.audit(c,'SUPPLY.REQUESTED',id,context);return requestDto(found(await model.request(id,c)));
        }); },
        async decide(id,status,context) { return tx(context,async(c,a)=>{
            if(!['ADMIN','FORNECEDOR'].includes(a.role))throw ApiError.acessoNegado();
            const r=found(await model.request(id,c,true)),item=found(await model.item(itemKind(r),itemId(r),c,true));await supplier(c,a,item.id_fornecedor);
            if(r.status!== 'PENDENTE')throw conflict('Solicitação já decidida');
            await grant(c,item.id_fornecedor,item.id_local);await grant(c,item.id_fornecedor,r.id_local);
            if(status==='APROVADA'){
                if(item.status!=='DISPONIVEL'||item.quantidade-(item.quantidade_reservada??0)<r.quantidade)throw conflict('Saldo insuficiente');
                if(itemKind(r)==='equipment'&&(item.quantidade!==r.quantidade||await model.equipmentInTransit(itemId(r),c)))throw conflict('Equipamento exige transferência integral e livre');
                if(await model.shipmentByRequest(id,c))throw conflict('Envio já vinculado');
                await model.createShipment(c,{supplierId:item.id_fornecedor,originId:item.id_local,destinationId:r.id_local,requestId:id,inputId:r.id_insumo,equipmentId:r.id_equipamento,quantity:r.quantidade});
            }
            await model.setRequest(c,id,status);await identity.audit(c,`SUPPLY.${status}`,id,context);return requestDto(found(await model.request(id,c)));
        }); },
        async shipments(q,context) { return tx(context,async(c,a)=>{if(!['ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR'].includes(a.role))throw ApiError.acessoNegado();if(a.role==='FORNECEDOR'){const own=found(await model.supplierByUser(a.id,c));if(own.status!=='ATIVO')throw ApiError.acessoNegado();q.supplierId=idString(own.id_fornecedor);}if(['SUPERVISOR','COLABORADOR'].includes(a.role)){if(!q.localId||!q.sessionId)throw ApiError.validacao('localId e sessionId obrigatórios');await staff(c,a,q.sessionId,q.localId,true);}return page(await model.listShipments(q,c),q,shipmentDto,'id_logistica');}); },
        async shipment(id,context) { return tx(context,async(c,a)=>{const r=found(await model.shipment(id,c));await supplierOrStaff(c,a,r);return shipmentDto(r);}); },
        async returnEquipment(id,context) { return tx(context,async(c,a)=>{
            const initial=found(await model.shipment(id,c)),request=found(await model.request(initial.id_solicitacao,c,true));
            const r=found(await model.shipment(id,c,true));
            if(!r.id_equipamento_origem||r.status!=='RECEBIDO'||request.status!=='FINALIZADA')throw conflict('Devolução exige equipamento recebido');
            const session=found(await model.session(request.id_sessao,c));
            if(session.status!=='ENCERRADA')throw conflict('Sessão ainda não encerrada');
            if(a.role!=='ADMIN')await staff(c,a,request.id_sessao,request.id_local,true);
            const equipment=found(await model.item('equipment',r.id_equipamento_origem,c,true));
            if(!same(equipment.id_fornecedor,r.id_fornecedor)||!same(equipment.id_local,r.id_local_destino)||equipment.quantidade!==r.quantidade)throw conflict('Equipamento ou local divergente');
            await grant(c,r.id_fornecedor,r.id_local_origem);await grant(c,r.id_fornecedor,r.id_local_destino);
            await model.changeEquipment(c,r.id_equipamento_origem,r.id_local_origem);
            await model.movement(c,{equipmentId:r.id_equipamento_origem,shipmentId:id,actorId:a.id,type:'DEVOLUCAO',quantity:r.quantidade,reason:`DEVOLUCAO:${r.id_local_destino}->${r.id_local_origem}`});
            await model.setReturned(c,id,a.id);await identity.audit(c,'LOGISTICS.RETURNED',id,context);
            return shipmentDto(found(await model.shipment(id,c)));
        }); },
        async transitionShipment(id,action,context) { return tx(context,async(c,a)=>{
            const initial=found(await model.shipment(id,c));const request=found(await model.request(initial.id_solicitacao,c,true));const r=found(await model.shipment(id,c,true));
            if(request.status!=='APROVADA'||!same(r.id_solicitacao,request.id_solicitacao))throw conflict('Solicitação incompatível');
            const kind=itemKind(request),source=found(await model.item(kind,itemId(request),c,true));
            if(!same(source.id_fornecedor,r.id_fornecedor)||!same(source.id_local,r.id_local_origem)||!same(r.id_local_destino,request.id_local)||r.quantidade!==request.quantidade)throw conflict('Origem, destino ou item divergente');
            await grant(c,r.id_fornecedor,r.id_local_origem);await grant(c,r.id_fornecedor,r.id_local_destino);
            if(action==='send'){
                await supplier(c,a,r.id_fornecedor);if(r.status!=='PENDENTE')throw conflict('Envio já iniciado');
                if(source.status!=='DISPONIVEL'||source.quantidade-(source.quantidade_reservada??0)<r.quantidade)throw conflict('Saldo insuficiente');
                if(kind==='equipment'&&source.quantidade!==r.quantidade)throw conflict('Transferência parcial de equipamento indisponível');
                if(kind==='input'){const changed=await model.changeInput(c,itemId(request),-r.quantidade);if(changed[0].affectedRows!==1)throw conflict('Saldo insuficiente');}
                await model.movement(c,{inputId:r.id_insumo_origem,equipmentId:r.id_equipamento_origem,shipmentId:id,actorId:a.id,type:'SAIDA',quantity:-r.quantidade,reason:`ENVIO:${id}`});
                await model.setShipment(c,id,'ENVIADO');
            }else if(action==='transit'){
                await supplier(c,a,r.id_fornecedor);if(r.status!=='ENVIADO')throw conflict('Estado de envio incompatível');await model.setShipment(c,id,'EM_TRANSITO');
            }else if(action==='receive'){
                if(a.role!=='ADMIN'){if(a.role==='FORNECEDOR')throw ApiError.acessoNegado();await staff(c,a,request.id_sessao,request.id_local);}
                if(!['ENVIADO','EM_TRANSITO'].includes(r.status))throw conflict('Recebimento exige envio ativo');
                if(kind==='input'){
                    let targetId=itemId(request);
                    if(!same(r.id_local_origem,r.id_local_destino)){targetId=await model.cloneInput(c,source,r.id_local_destino);await model.setDestinationItem(c,id,targetId);}
                    const changed=await model.changeInput(c,targetId,r.quantidade);if(changed[0].affectedRows!==1)throw conflict('Saldo de destino inválido');
                    await model.movement(c,{inputId:targetId,shipmentId:id,actorId:a.id,type:'ENTRADA',quantity:r.quantidade,reason:`RECEBIMENTO:${id}`});
                }else{
                    if(source.quantidade!==r.quantidade)throw conflict('Quantidade do equipamento alterada');
                    await model.changeEquipment(c,itemId(request),r.id_local_destino);
                    await model.movement(c,{equipmentId:itemId(request),shipmentId:id,actorId:a.id,type:'ENTRADA',quantity:r.quantidade,reason:`TRANSFERENCIA:${r.id_local_origem}->${r.id_local_destino}`});
                }
                await model.setShipment(c,id,'RECEBIDO',a.id);await model.setRequest(c,request.id_solicitacao,'FINALIZADA');
            }else if(action==='cancel'){
                await supplier(c,a,r.id_fornecedor);if(r.status!=='PENDENTE')throw conflict('Somente envio pendente pode ser cancelado');
                await model.setShipment(c,id,'CANCELADO');await model.setRequest(c,request.id_solicitacao,'RECUSADA');
            }
            await identity.audit(c,`LOGISTICS.${action.toUpperCase()}`,id,context);return shipmentDto(found(await model.shipment(id,c)));
        }); }
    };
    async function supplierOrStaff(c,a,r){if(a.role==='ADMIN')return;if(a.role==='FORNECEDOR')return supplier(c,a,r.id_fornecedor);const req=found(await model.request(r.id_solicitacao,c));return staff(c,a,req.id_sessao,req.id_local,true);}
}
