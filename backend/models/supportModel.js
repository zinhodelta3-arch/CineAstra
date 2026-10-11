import {idString} from '../utils/dto.js';
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
const projection='id_suporte,id_cliente,id_atendente,assunto,status,data_abertura,prazo_resposta_em,primeira_resposta_em,ultima_interacao_em,data_fechamento';

export function createSupportModel(){return {
    support:(c,id,lock=false)=>one(c,`SELECT ${projection} FROM suporte WHERE id_suporte=?${lock?' FOR UPDATE':''}`,[id]),
    ownerList:(c,owner,limit,cursor)=>rows(c,`SELECT ${projection} FROM suporte WHERE id_cliente=? AND id_suporte>? ORDER BY id_suporte LIMIT ?`,[owner,cursor,limit+1]),
    queue:(c,limit,cursor)=>rows(c,`SELECT ${projection} FROM suporte WHERE id_suporte>? AND status IN ('ABERTO','EM_ATENDIMENTO') ORDER BY id_suporte LIMIT ?`,[cursor,limit+1]),
    adminUser:(c,id)=>one(c,"SELECT id_usuario FROM usuarios WHERE id_usuario=? AND tipo_usuario='ADMIN' AND status='ATIVO'",[id]),
    async create(c,owner,input){const [result]=await c.execute("INSERT INTO suporte(id_cliente,assunto,mensagem,status,data_abertura,prazo_resposta_em,ultima_interacao_em) VALUES(?,?,?,'ABERTO',UTC_TIMESTAMP(),DATE_ADD(UTC_TIMESTAMP(),INTERVAL 5 DAY),UTC_TIMESTAMP())",[owner,input.subject,input.message]);return idString(result.insertId);},
    async append(c,id,author,role,message){const [result]=await c.execute("INSERT INTO suporte_mensagens(id_suporte,id_autor,papel,mensagem,registrada_em,origem) VALUES(?,?,?,?,UTC_TIMESTAMP(),'NOVA')",[id,author,role,message]);return idString(result.insertId);},
    messages:(c,id,limit,cursor)=>rows(c,'SELECT id_mensagem,id_autor,papel,mensagem,registrada_em,origem FROM suporte_mensagens WHERE id_suporte=? AND id_mensagem>? ORDER BY id_mensagem LIMIT ?',[id,cursor,limit+1]),
    lastAdminMessage:(c,id)=>one(c,"SELECT id_mensagem FROM suporte_mensagens WHERE id_suporte=? AND papel='ADMIN' ORDER BY id_mensagem DESC LIMIT 1",[id]),
    lastClientMessage:(c,id)=>one(c,"SELECT id_mensagem FROM suporte_mensagens WHERE id_suporte=? AND papel='CLIENTE' ORDER BY id_mensagem DESC LIMIT 1",[id]),
    assign:(c,id,adminId)=>c.execute('UPDATE suporte SET id_atendente=? WHERE id_suporte=? AND id_atendente IS NULL',[adminId,id]),
    latestResponse:(c,id,message)=>c.execute('UPDATE suporte SET resposta=?,primeira_resposta_em=COALESCE(primeira_resposta_em,UTC_TIMESTAMP()),ultima_interacao_em=UTC_TIMESTAMP() WHERE id_suporte=?',[message,id]),
    clientInteraction:(c,id,reopen)=>c.execute(`UPDATE suporte SET ultima_interacao_em=UTC_TIMESTAMP()${reopen?",status='ABERTO',prazo_resposta_em=DATE_ADD(UTC_TIMESTAMP(),INTERVAL 5 DAY),primeira_resposta_em=NULL":''} WHERE id_suporte=?`,[id]),
    live:(c,id)=>one(c,'SELECT id_atendimento,id_atendente,iniciado_em,encerrado_em FROM suporte_atendimentos WHERE id_suporte=? AND encerrado_em IS NULL ORDER BY id_atendimento DESC LIMIT 1 FOR UPDATE',[id]),
    expiredIds:(c,limit)=>rows(c,'SELECT id_suporte FROM suporte_atendimentos WHERE encerrado_em IS NULL AND iniciado_em<=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 10 MINUTE) ORDER BY id_suporte LIMIT ?',[limit]),
    expireLive:(c,id)=>c.execute('UPDATE suporte_atendimentos SET encerrado_em=DATE_ADD(iniciado_em,INTERVAL 10 MINUTE) WHERE id_suporte=? AND encerrado_em IS NULL AND iniciado_em<=DATE_SUB(UTC_TIMESTAMP(),INTERVAL 10 MINUTE)',[id]),
    openQueue:(c,id)=>c.execute("UPDATE suporte SET status='ABERTO' WHERE id_suporte=? AND status='EM_ATENDIMENTO'",[id]),
    async startLive(c,id,adminId){const [result]=await c.execute('INSERT INTO suporte_atendimentos(id_suporte,id_atendente,iniciado_em) VALUES(?,?,UTC_TIMESTAMP())',[id,adminId]);await c.execute("UPDATE suporte SET status='EM_ATENDIMENTO' WHERE id_suporte=?",[id]);return idString(result.insertId);},
    endLive:(c,id)=>c.execute('UPDATE suporte_atendimentos SET encerrado_em=LEAST(UTC_TIMESTAMP(),DATE_ADD(iniciado_em,INTERVAL 10 MINUTE)) WHERE id_suporte=? AND encerrado_em IS NULL',[id]),
    resolve:(c,id)=>c.execute("UPDATE suporte SET status='RESOLVIDO' WHERE id_suporte=? AND status IN ('ABERTO','EM_ATENDIMENTO')",[id]),
    close:(c,id)=>c.execute("UPDATE suporte SET status='FECHADO',data_fechamento=UTC_TIMESTAMP() WHERE id_suporte=? AND status='RESOLVIDO'",[id])
};}
