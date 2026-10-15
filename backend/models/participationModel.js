import {idString} from '../utils/dto.js';

const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
export function createParticipationModel(){return {
  subscription:(c,id,lock=false)=>one(c,`SELECT id_assinatura,id_usuario,status,periodicidade,tipo_divisao,tipo_divisao_proximo,tipo_divisao_efetiva_em,preco_contratado,limite_membros_contratado,inicio,fim FROM assinaturas WHERE id_assinatura=?${lock?' FOR UPDATE':''}`,[id]),
  user:(c,id)=>one(c,"SELECT u.id_usuario,u.status,u.tipo_usuario,v.faixa_etaria FROM usuarios u LEFT JOIN verificacoes_idade v ON v.id_verificacao=(SELECT MAX(x.id_verificacao) FROM verificacoes_idade x WHERE x.id_usuario=u.id_usuario AND x.expiracao>UTC_TIMESTAMP(3)) WHERE u.id_usuario=?",[id]),
  participants:(c,id)=>rows(c,'SELECT id_usuario,status,entrada_em,saida_em,atualizado_em FROM assinatura_participantes WHERE id_assinatura=? ORDER BY id_usuario',[id]),
  participant:(c,id,userId)=>one(c,'SELECT id_usuario,status FROM assinatura_participantes WHERE id_assinatura=? AND id_usuario=?',[id,userId]),
  activeCount:(c,id)=>one(c,"SELECT COUNT(*) AS total FROM assinatura_participantes WHERE id_assinatura=? AND status IN ('ATIVO','SUSPENSO')",[id]),
  pendingCount:(c,id)=>one(c,"SELECT COUNT(*) AS total FROM convites_plano WHERE id_assinatura=? AND status='PENDENTE'",[id]),
  invitation:(c,id,lock=false)=>one(c,`SELECT id_convite,id_assinatura,id_usuario_convidado,status,data_convite,data_resposta FROM convites_plano WHERE id_convite=?${lock?' FOR UPDATE':''}`,[id]),
  invitationForUser:(c,subscriptionId,userId)=>one(c,'SELECT id_convite,status FROM convites_plano WHERE id_assinatura=? AND id_usuario_convidado=?',[subscriptionId,userId]),
  myInvitations:(c,userId,limit,cursor)=>rows(c,'SELECT id_convite,id_assinatura,id_usuario_convidado,status,data_convite,data_resposta FROM convites_plano WHERE id_usuario_convidado=? AND id_convite>? ORDER BY id_convite LIMIT ?',[userId,cursor,limit+1]),
  async invite(c,subscriptionId,userId){const [r]=await c.execute("INSERT INTO convites_plano(id_assinatura,id_usuario_convidado,status) VALUES(?,?,'PENDENTE')",[subscriptionId,userId]);return idString(r.insertId);},
  resetInvitation:(c,id)=>c.execute("UPDATE convites_plano SET status='PENDENTE',data_convite=UTC_TIMESTAMP(3),data_resposta=NULL WHERE id_convite=? AND status IN ('ACEITO','RECUSADO','EXPIRADO')",[id]),
  decideInvitation:(c,id,status)=>c.execute('UPDATE convites_plano SET status=?,data_resposta=UTC_TIMESTAMP(3) WHERE id_convite=? AND status=\'PENDENTE\'',[status,id]),
  upsertParticipant:(c,subscriptionId,userId)=>c.execute("INSERT INTO assinatura_participantes(id_assinatura,id_usuario,status) VALUES(?,?,'ATIVO') ON DUPLICATE KEY UPDATE status='ATIVO',entrada_em=UTC_TIMESTAMP(3),saida_em=NULL,atualizado_em=UTC_TIMESTAMP(3)",[subscriptionId,userId]),
  setParticipant:(c,subscriptionId,userId,status)=>c.execute('UPDATE assinatura_participantes SET status=?,saida_em=IF(?=\'SAIU\',UTC_TIMESTAMP(3),saida_em),atualizado_em=UTC_TIMESTAMP(3) WHERE id_assinatura=? AND id_usuario=?',[status,status,subscriptionId,userId]),
  event:(c,subscriptionId,userId,actorId,event)=>c.execute('INSERT INTO assinatura_participante_eventos(id_assinatura,id_usuario,id_ator,evento) VALUES(?,?,?,?)',[subscriptionId,userId,actorId,event]),
  events:(c,id,limit,cursor,userId=null)=>rows(c,`SELECT id_evento,id_usuario,id_ator,evento,criado_em FROM assinatura_participante_eventos WHERE id_assinatura=? AND id_evento>?${userId?' AND id_usuario=?':''} ORDER BY id_evento LIMIT ?`,userId?[id,cursor,userId,limit+1]:[id,cursor,limit+1]),
  pendingProposal:(c,id)=>one(c,"SELECT id_proposta FROM assinatura_rateio_propostas WHERE id_assinatura=? AND status='PENDENTE' LIMIT 1",[id]),
  proposal:(c,id)=>one(c,'SELECT id_proposta,id_assinatura,id_proponente,tipo_divisao,competencia_efetiva,status,criada_em,decidida_em FROM assinatura_rateio_propostas WHERE id_proposta=?',[id]),
  async createProposal(c,subscriptionId,ownerId,mode,effective){const [r]=await c.execute("INSERT INTO assinatura_rateio_propostas(id_assinatura,id_proponente,tipo_divisao,competencia_efetiva,status) VALUES(?,?,?,?,'PENDENTE')",[subscriptionId,ownerId,mode,effective]);return idString(r.insertId);},
  addConsent:(c,proposalId,userId,accepted)=>c.execute('INSERT INTO assinatura_rateio_consensos(id_proposta,id_usuario,status,decidido_em) VALUES(?,?,?,IF(?=\'ACEITO\',UTC_TIMESTAMP(3),NULL))',[proposalId,userId,accepted?'ACEITO':'PENDENTE',accepted?'ACEITO':'PENDENTE']),
  consent:(c,proposalId,userId)=>one(c,'SELECT status FROM assinatura_rateio_consensos WHERE id_proposta=? AND id_usuario=?',[proposalId,userId]),
  vote:(c,proposalId,userId,status)=>c.execute("UPDATE assinatura_rateio_consensos SET status=?,decidido_em=UTC_TIMESTAMP(3) WHERE id_proposta=? AND id_usuario=? AND status='PENDENTE'",[status,proposalId,userId]),
  pendingVotes:(c,proposalId)=>one(c,"SELECT COUNT(*) AS total FROM assinatura_rateio_consensos WHERE id_proposta=? AND status='PENDENTE'",[proposalId]),
  closeProposal:(c,id,status)=>c.execute("UPDATE assinatura_rateio_propostas SET status=?,decidida_em=UTC_TIMESTAMP(3) WHERE id_proposta=? AND status='PENDENTE'",[status,id]),
  scheduleMode:(c,subscriptionId,mode,effective)=>c.execute('UPDATE assinaturas SET tipo_divisao_proximo=?,tipo_divisao_efetiva_em=? WHERE id_assinatura=?',[mode,effective,subscriptionId]),
  charges:(c,subscriptionId,competence)=>rows(c,'SELECT id_cobranca,id_usuario,valor_devido,valor_multa_aplicada,juros_mora,correcao_ipca,ipca_periodo_final,status,data_vencimento,data_pagamento FROM assinatura_cobrancas WHERE id_assinatura=? AND competencia=? ORDER BY id_usuario',[subscriptionId,competence])
};}
