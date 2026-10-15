import {idString} from '../utils/dto.js';
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
export function createNewsletterCampaignModel(){return {
    categories:c=>rows(c,'SELECT id_categoria,codigo,nome,descricao,ativo FROM newsletter_categorias ORDER BY id_categoria'),
    category:(c,id,lock=false)=>one(c,`SELECT id_categoria,codigo,nome,descricao,ativo FROM newsletter_categorias WHERE id_categoria=?${lock?' FOR UPDATE':''}`,[id]),
    async createCategory(c,input){const [r]=await c.execute('INSERT INTO newsletter_categorias(codigo,nome,descricao,ativo) VALUES(?,?,?,TRUE)',[input.code,input.name,input.description??null]);return idString(r.insertId);},
    patchCategory:(c,id,input)=>c.execute('UPDATE newsletter_categorias SET nome=?,descricao=? WHERE id_categoria=?',[input.name,input.description??null,id]),
    archiveCategory:(c,id)=>c.execute('UPDATE newsletter_categorias SET ativo=FALSE WHERE id_categoria=?',[id]),
    cancelCategoryCampaigns:(c,id)=>c.execute("UPDATE newsletter_campanhas SET status='CANCELADA' WHERE id_categoria=? AND status IN ('RASCUNHO','AGENDADA','ENVIANDO')",[id]),
    cancelCategoryQueue:(c,id)=>c.execute("UPDATE newsletter_envios e JOIN newsletter_campanhas camp ON camp.id_campanha=e.id_campanha SET e.status='CANCELADO',e.processando_desde=NULL WHERE camp.id_categoria=? AND e.status IN ('PENDENTE','FALHOU','PROCESSANDO')",[id]),
    campaigns:(c,limit,cursor)=>rows(c,'SELECT id_campanha,id_categoria,nome,assunto,conteudo_html,conteudo_texto,status,agendada_para,iniciada_em,concluida_em FROM newsletter_campanhas WHERE id_campanha>? ORDER BY id_campanha LIMIT ?',[cursor,limit+1]),
    campaign:(c,id,lock=false)=>one(c,`SELECT id_campanha,id_categoria,nome,assunto,conteudo_html,conteudo_texto,status,agendada_para,iniciada_em,concluida_em FROM newsletter_campanhas WHERE id_campanha=?${lock?' FOR UPDATE':''}`,[id]),
    async createCampaign(c,input){const [r]=await c.execute("INSERT INTO newsletter_campanhas(id_categoria,nome,assunto,conteudo_html,conteudo_texto,status) VALUES(?,?,?,?,?,'RASCUNHO')",[input.categoryId,input.name,input.subject,input.html,input.text]);return idString(r.insertId);},
    patchCampaign:(c,id,input)=>c.execute('UPDATE newsletter_campanhas SET id_categoria=?,nome=?,assunto=?,conteudo_html=?,conteudo_texto=? WHERE id_campanha=? AND status=\'RASCUNHO\'',[input.categoryId,input.name,input.subject,input.html,input.text,id]),
    schedule:(c,id,at)=>c.execute("UPDATE newsletter_campanhas SET status='AGENDADA',agendada_para=? WHERE id_campanha=? AND status='RASCUNHO'",[at,id]),
    queue:(c,id)=>c.execute(`INSERT INTO newsletter_envios(id_campanha,id_inscrito)
        SELECT camp.id_campanha,sub.id_inscrito FROM newsletter_campanhas camp
        JOIN newsletter_categorias cat ON cat.id_categoria=camp.id_categoria AND cat.ativo=TRUE
        JOIN newsletter_preferencias pref ON pref.id_categoria=cat.id_categoria AND pref.aceita=TRUE
        JOIN newsletter_inscritos sub ON sub.id_inscrito=pref.id_inscrito AND sub.status='ATIVO' AND sub.confirmado_em IS NOT NULL
        WHERE camp.id_campanha=? AND camp.status='AGENDADA'
        ON DUPLICATE KEY UPDATE id_envio=newsletter_envios.id_envio`,[id]),
    cancelCampaign:(c,id)=>c.execute("UPDATE newsletter_campanhas SET status='CANCELADA' WHERE id_campanha=? AND status IN ('RASCUNHO','AGENDADA','ENVIANDO')",[id]),
    cancelQueue:(c,id)=>c.execute("UPDATE newsletter_envios SET status='CANCELADO',processando_desde=NULL WHERE id_campanha=? AND status IN ('PENDENTE','FALHOU','PROCESSANDO')",[id])
};}
