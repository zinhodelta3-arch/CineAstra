const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;

export function createNewsletterDeliveryModel(){return {
    activateDue:c=>c.execute("UPDATE newsletter_campanhas SET status='ENVIANDO',iniciada_em=UTC_TIMESTAMP() WHERE status='AGENDADA' AND agendada_para<=UTC_TIMESTAMP()"),
    expireLeases:(c,maxAttempts,leaseSeconds)=>c.execute("UPDATE newsletter_envios SET status='FALHOU',processando_desde=NULL,ultimo_erro='LEASE_EXPIRED_MAX_ATTEMPTS' WHERE status='PROCESSANDO' AND tentativas>=? AND processando_desde<DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? SECOND)",[maxAttempts,leaseSeconds]),
    next:(c,maxAttempts,leaseSeconds)=>one(c,`SELECT e.id_envio,e.tentativas FROM newsletter_envios e
        JOIN newsletter_campanhas camp ON camp.id_campanha=e.id_campanha
        WHERE camp.status='ENVIANDO' AND (
            (e.status='PENDENTE' AND e.tentativas<?) OR
            (e.status='FALHOU' AND e.tentativas<? AND TIMESTAMPDIFF(SECOND,e.ultima_tentativa_em,UTC_TIMESTAMP())>=LEAST(POW(2,e.tentativas-1)*60,3600)) OR
            (e.status='PROCESSANDO' AND e.tentativas<? AND e.processando_desde<DATE_SUB(UTC_TIMESTAMP(),INTERVAL ? SECOND))
        ) ORDER BY e.id_envio LIMIT 1 FOR UPDATE OF e SKIP LOCKED`,[maxAttempts,maxAttempts,maxAttempts,leaseSeconds]),
    markClaim:(c,id)=>c.execute("UPDATE newsletter_envios SET status='PROCESSANDO',tentativas=tentativas+1,ultima_tentativa_em=UTC_TIMESTAMP(),processando_desde=UTC_TIMESTAMP(),ultimo_erro=NULL WHERE id_envio=?",[id]),
    delivery:(c,id,attempt)=>one(c,`SELECT e.id_envio,e.id_campanha,e.id_inscrito,sub.email,camp.assunto,camp.conteudo_html,camp.conteudo_texto
        FROM newsletter_envios e JOIN newsletter_campanhas camp ON camp.id_campanha=e.id_campanha
        JOIN newsletter_categorias cat ON cat.id_categoria=camp.id_categoria
        JOIN newsletter_inscritos sub ON sub.id_inscrito=e.id_inscrito
        JOIN newsletter_preferencias pref ON pref.id_inscrito=sub.id_inscrito AND pref.id_categoria=cat.id_categoria
        LEFT JOIN newsletter_bloqueios block ON block.id_inscrito=sub.id_inscrito
        WHERE e.id_envio=? AND e.status='PROCESSANDO' AND e.tentativas=?
        AND camp.status='ENVIANDO' AND cat.ativo=TRUE AND sub.status='ATIVO' AND sub.confirmado_em IS NOT NULL
        AND pref.aceita=TRUE AND block.id_inscrito IS NULL`,[id,attempt]),
    cancel:(c,id,attempt)=>c.execute("UPDATE newsletter_envios SET status='CANCELADO',processando_desde=NULL WHERE id_envio=? AND status='PROCESSANDO' AND tentativas=?",[id,attempt]),
    sent:(c,id,attempt,messageId)=>c.execute("UPDATE newsletter_envios SET status='ENVIADO',enviado_em=UTC_TIMESTAMP(),processando_desde=NULL,id_mensagem_provedor=? WHERE id_envio=? AND status='PROCESSANDO' AND tentativas=?",[messageId,id,attempt]),
    failed:(c,id,attempt)=>c.execute("UPDATE newsletter_envios SET status='FALHOU',processando_desde=NULL,ultimo_erro='PROVIDER_SEND_FAILED' WHERE id_envio=? AND status='PROCESSANDO' AND tentativas=?",[id,attempt]),
    complete:(c,maxAttempts)=>c.execute(`UPDATE newsletter_campanhas camp SET status='CONCLUIDA',concluida_em=UTC_TIMESTAMP()
        WHERE camp.status='ENVIANDO' AND NOT EXISTS (
            SELECT 1 FROM newsletter_envios e WHERE e.id_campanha=camp.id_campanha
            AND (e.status IN ('PENDENTE','PROCESSANDO') OR (e.status='FALHOU' AND e.tentativas<?))
        )`,[maxAttempts]),
    subscriberByEmail:(c,email)=>one(c,'SELECT id_inscrito,status FROM newsletter_inscritos WHERE email=? FOR UPDATE',[email]),
    suppress:(c,id,reason,eventId)=>c.execute('INSERT INTO newsletter_bloqueios(id_inscrito,motivo,id_evento_provedor) VALUES(?,?,?) ON DUPLICATE KEY UPDATE id_inscrito=newsletter_bloqueios.id_inscrito',[id,reason,eventId]),
    blockActive:(c,id)=>c.execute("UPDATE newsletter_inscritos SET status='BLOQUEADO' WHERE id_inscrito=? AND status IN ('ATIVO','PENDENTE')",[id]),
    cancelSubscriberQueue:(c,id)=>c.execute("UPDATE newsletter_envios SET status='CANCELADO',processando_desde=NULL WHERE id_inscrito=? AND status IN ('PENDENTE','FALHOU','PROCESSANDO')",[id])
};}
