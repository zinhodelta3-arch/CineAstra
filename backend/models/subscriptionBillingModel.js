import {idString} from '../utils/dto.js';
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
export function createSubscriptionBillingModel(database){return {
  dueSubscriptions:(today,limit)=>rows(database,"SELECT a.id_assinatura FROM assinaturas a WHERE a.status='ATIVA' AND a.renovacao_automatica=TRUE AND a.fim< ? AND a.preco_contratado IS NOT NULL AND NOT EXISTS(SELECT 1 FROM assinatura_ciclos c WHERE c.id_assinatura=a.id_assinatura AND c.competencia=DATE_FORMAT(DATE_ADD(a.fim,INTERVAL 1 DAY),'%Y-%m-01')) ORDER BY a.id_assinatura LIMIT ?",[today,limit]),
  subscription:(c,id,lock=false)=>one(c,`SELECT id_assinatura,id_usuario,status,renovacao_automatica,periodicidade,tipo_divisao,tipo_divisao_proximo,tipo_divisao_efetiva_em,preco_contratado,fim,suspenso_por_cobranca FROM assinaturas WHERE id_assinatura=?${lock?' FOR UPDATE':''}`,[id]),
  participants:(c,id)=>rows(c,"SELECT id_usuario,status,suspenso_por_cobranca FROM assinatura_participantes WHERE id_assinatura=? AND status IN ('ATIVO','SUSPENSO') ORDER BY id_usuario",[id]),
  cycle:(c,id,competence)=>one(c,'SELECT id_ciclo FROM assinatura_ciclos WHERE id_assinatura=? AND competencia=?',[id,competence]),
  async insertCycle(c,id,competence,due,mode,total,shares){const [r]=await c.execute('INSERT INTO assinatura_ciclos(id_assinatura,competencia,vencimento,tipo_divisao,valor_total,participantes_snapshot) VALUES(?,?,?,?,?,?)',[id,competence,due,mode,total,JSON.stringify(shares)]);return idString(r.insertId);},
  insertCharge:(c,id,userId,competence,amount,due)=>c.execute("INSERT INTO assinatura_cobrancas(id_assinatura,id_usuario,competencia,valor_devido,status,data_vencimento) VALUES(?,?,?,?,?,?)",[id,userId,competence,amount,amount==='0.00'?'ISENTO':'PENDENTE',due]),
  applyMode:(c,id,mode)=>c.execute('UPDATE assinaturas SET tipo_divisao=?,tipo_divisao_proximo=NULL,tipo_divisao_efetiva_em=NULL WHERE id_assinatura=?',[mode,id]),
  dueCharges:(today,limit,cursor='0')=>rows(database,"SELECT id_cobranca,id_assinatura FROM assinatura_cobrancas WHERE id_cobranca>? AND status IN ('PENDENTE','ATRASADO') AND data_vencimento<? ORDER BY id_cobranca LIMIT ?",[cursor,today,limit]),
  charge:(c,id,lock=false)=>one(c,`SELECT id_cobranca,id_assinatura,id_usuario,competencia,valor_devido,valor_multa_aplicada,juros_mora,correcao_ipca,status,data_vencimento,encargos_calculados_ate FROM assinatura_cobrancas WHERE id_cobranca=?${lock?' FOR UPDATE':''}`,[id]),
  openIntention:(c,id)=>one(c,"SELECT id_intencao FROM pagamento_intencoes WHERE id_cobranca=? AND estado IN ('PREPARADA','ENVIADA') LIMIT 1",[id]),
  updateCharges:(c,id,fine,interest,correction,today,period)=>c.execute("UPDATE assinatura_cobrancas SET status='ATRASADO',valor_multa_aplicada=?,juros_mora=?,correcao_ipca=?,encargos_calculados_ate=?,ipca_periodo_final=? WHERE id_cobranca=? AND status IN ('PENDENTE','ATRASADO')",[fine,interest,correction,today,period,id]),
  markLate:(c,id)=>c.execute("UPDATE assinatura_cobrancas SET status='ATRASADO' WHERE id_cobranca=? AND status='PENDENTE'",[id]),
  async mark(c,id,milestone){const [r]=await c.execute('INSERT IGNORE INTO assinatura_cobranca_marcos(id_cobranca,marco) VALUES(?,?)',[id,milestone]);return r.affectedRows===1;},
  suspendOwner:(c,id)=>c.execute('UPDATE assinaturas SET suspenso_por_cobranca=TRUE WHERE id_assinatura=?',[id]),
  suspendParticipant:(c,id,userId)=>c.execute("UPDATE assinatura_participantes SET status='SUSPENSO',suspenso_por_cobranca=TRUE,atualizado_em=UTC_TIMESTAMP(3) WHERE id_assinatura=? AND id_usuario=? AND status IN ('ATIVO','SUSPENSO')",[id,userId]),
  resumeOwner:(c,id)=>c.execute('UPDATE assinaturas SET suspenso_por_cobranca=FALSE WHERE id_assinatura=?',[id]),
  resumeParticipant:(c,id,userId)=>c.execute("UPDATE assinatura_participantes SET status='ATIVO',suspenso_por_cobranca=FALSE,atualizado_em=UTC_TIMESTAMP(3) WHERE id_assinatura=? AND id_usuario=? AND status='SUSPENSO' AND suspenso_por_cobranca=TRUE",[id,userId]),
  leaveParticipant:(c,id,userId)=>c.execute("UPDATE assinatura_participantes SET status='SAIU',saida_em=UTC_TIMESTAMP(3),atualizado_em=UTC_TIMESTAMP(3) WHERE id_assinatura=? AND id_usuario=? AND status IN ('ATIVO','SUSPENSO')",[id,userId]),
  cancelSubscription:(c,id)=>c.execute("UPDATE assinaturas SET status='CANCELADA',renovacao_automatica=FALSE,fim=UTC_DATE() WHERE id_assinatura=? AND status='ATIVA'",[id]),
  participantEvent:(c,id,userId,actorId,event)=>c.execute('INSERT INTO assinatura_participante_eventos(id_assinatura,id_usuario,id_ator,evento) VALUES(?,?,?,?)',[id,userId,actorId,event]),
  unpaidOther:(c,id,userId)=>one(c,"SELECT id_cobranca FROM assinatura_cobrancas WHERE id_assinatura=? AND id_usuario=? AND status='ATRASADO' LIMIT 1",[id,userId]),
  chargesForUser:(c,id,userId,limit,cursor)=>rows(c,'SELECT id_cobranca,competencia,valor_devido,valor_multa_aplicada,juros_mora,correcao_ipca,status,data_vencimento,data_pagamento FROM assinatura_cobrancas WHERE id_assinatura=? AND id_usuario=? AND id_cobranca>? ORDER BY id_cobranca LIMIT ?',[id,userId,cursor,limit+1])
};}
