import {interval} from './sessionService.js';
import {idString} from '../utils/dto.js';

const rank={FINALIZADO:0,AGENDADO:1,EM_REALIZACAO:2,ATRASADO:3,PARTICIPANDO:4};
export function operationalItem(row,now=Date.now()){
    const type=row.id_sessao?'INGRESSO_SESSAO':row.id_combo||row.id_insumo?'RETIRADA_INSUMO':'ACESSO_STREAMING';
    if(type==='ACESSO_STREAMING'||!row.id_ticket)return {itemId:idString(row.id_item),type,status:null};
    let status;
    if(row.ticket_status==='UTILIZADO')status=type==='INGRESSO_SESSAO'&&row.ultima_passagem==='ENTRADA'?'PARTICIPANDO':'FINALIZADO';
    else if(row.ticket_status==='CANCELADO')status=null;
    else if(row.data&&row.horario_inicio&&row.horario_fim){
        const {start,end}=interval(row),limit=end+(row.id_combo?1800000:0);
        status=now<start?'AGENDADO':type==='INGRESSO_SESSAO'?'ATRASADO':now<=limit?'EM_REALIZACAO':'ATRASADO';
    }else status='EM_REALIZACAO';
    return {itemId:idString(row.id_item),ticketId:row.id_ticket?idString(row.id_ticket):null,type,status};
}
export function operationalOrder(rows,now=Date.now()){
    const items=rows.map(row=>operationalItem(row,now));
    const statuses=items.map(x=>x.status).filter(Boolean);
    return {operationalStatus:statuses.length?statuses.reduce((a,b)=>rank[a]>=rank[b]?a:b):null,items};
}
