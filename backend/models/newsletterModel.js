import {idString} from '../utils/dto.js';
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
export function createNewsletterModel(){return {
    categories:c=>rows(c,'SELECT id_categoria,codigo,nome,descricao FROM newsletter_categorias WHERE ativo=TRUE ORDER BY id_categoria'),
    byEmail:(c,email)=>one(c,'SELECT id_inscrito,status FROM newsletter_inscritos WHERE email=? FOR UPDATE',[email]),
    async insert(c,{email,name,version}){const [r]=await c.execute("INSERT INTO newsletter_inscritos(email,nome,status,origem,versao_termo,consentimento_em) VALUES(?,?,'PENDENTE','SITE',?,UTC_TIMESTAMP())",[email,name??null,version]);return idString(r.insertId);},
    preference:(c,id,categoryId)=>c.execute('INSERT INTO newsletter_preferencias(id_inscrito,id_categoria,aceita) VALUES(?,?,TRUE)',[id,categoryId]),
    token:(c,id,hash)=>c.execute("INSERT INTO newsletter_tokens(id_inscrito,finalidade,token_hash,expira_em) VALUES(?,'CONFIRMACAO',?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 24 HOUR))",[id,hash]),
    tokenOwner:(c,hash)=>one(c,'SELECT id_inscrito FROM newsletter_tokens WHERE token_hash=?',[hash]),
    subscriber:(c,id)=>one(c,'SELECT id_inscrito,email,status,consentimento_em FROM newsletter_inscritos WHERE id_inscrito=? FOR UPDATE',[id]),
    lockedToken:(c,id,hash)=>one(c,'SELECT id_token,finalidade,utilizado_em,expira_em FROM newsletter_tokens WHERE id_inscrito=? AND token_hash=? FOR UPDATE',[id,hash]),
    useToken:(c,id)=>c.execute('UPDATE newsletter_tokens SET utilizado_em=UTC_TIMESTAMP() WHERE id_token=? AND utilizado_em IS NULL',[id]),
    activate:(c,id)=>c.execute("UPDATE newsletter_inscritos SET status='ATIVO',confirmado_em=UTC_TIMESTAMP() WHERE id_inscrito=? AND status='PENDENTE'",[id]),
    invalidateOther:(c,id,except)=>c.execute("UPDATE newsletter_tokens SET utilizado_em=UTC_TIMESTAMP() WHERE id_inscrito=? AND id_token<>? AND finalidade='CONFIRMACAO' AND utilizado_em IS NULL",[id,except]),
    authorizationToken:(c,id,purpose,hash)=>c.execute('INSERT INTO newsletter_tokens(id_inscrito,finalidade,token_hash,expira_em) VALUES(?,?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 30 MINUTE))',[id,purpose,hash]),
    preferences:(c,id)=>rows(c,'SELECT cat.codigo,cat.nome,COALESCE(np.aceita,FALSE) AS aceita FROM newsletter_categorias cat LEFT JOIN newsletter_preferencias np ON np.id_categoria=cat.id_categoria AND np.id_inscrito=? WHERE cat.ativo=TRUE ORDER BY cat.id_categoria',[id]),
    resetPreferences:(c,id)=>c.execute('UPDATE newsletter_preferencias SET aceita=FALSE WHERE id_inscrito=?',[id]),
    acceptPreference:(c,id,categoryId)=>c.execute('INSERT INTO newsletter_preferencias(id_inscrito,id_categoria,aceita) VALUES(?,?,TRUE) ON DUPLICATE KEY UPDATE aceita=TRUE',[id,categoryId]),
    cancelDisallowed:(c,id)=>c.execute("UPDATE newsletter_envios e JOIN newsletter_campanhas camp ON camp.id_campanha=e.id_campanha LEFT JOIN newsletter_preferencias p ON p.id_inscrito=e.id_inscrito AND p.id_categoria=camp.id_categoria SET e.status='CANCELADO' WHERE e.id_inscrito=? AND e.status IN ('PENDENTE','FALHOU') AND COALESCE(p.aceita,FALSE)=FALSE",[id]),
    unsubscribe:(c,id)=>c.execute("UPDATE newsletter_inscritos SET status='DESCADASTRADO',descadastrado_em=GREATEST(UTC_TIMESTAMP(),consentimento_em) WHERE id_inscrito=? AND status IN ('ATIVO','PENDENTE')",[id]),
    cancelQueue:(c,id)=>c.execute("UPDATE newsletter_envios SET status='CANCELADO' WHERE id_inscrito=? AND status IN ('PENDENTE','FALHOU')",[id]),
    invalidateTokens:(c,id)=>c.execute('UPDATE newsletter_tokens SET utilizado_em=GREATEST(UTC_TIMESTAMP(),criado_em) WHERE id_inscrito=? AND utilizado_em IS NULL',[id]),
    restart:(c,id,version)=>c.execute("UPDATE newsletter_inscritos SET status='PENDENTE',versao_termo=?,consentimento_em=UTC_TIMESTAMP(),confirmado_em=NULL,descadastrado_em=NULL WHERE id_inscrito=? AND status='DESCADASTRADO'",[version,id]),
    suppressed:(c,id)=>one(c,'SELECT id_inscrito FROM newsletter_bloqueios WHERE id_inscrito=?',[id])
};}
