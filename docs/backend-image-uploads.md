# Tarefa 15 — upload seguro de imagens (08/10/2026)

**CONCLUÍDA no escopo de staging local administrativo.** Implementação integrada, processamento e filesystem reais testados. Nenhuma migration ou alteração no frontend. Não altera filme.imagem nem cria associações de galeria; tarefa 16 deve promover uma cópia do staging para armazenamento durável e registrar o vínculo V4 com compensação em falha SQL.

## Contrato

| Método | Endpoint | Resposta |
| --- | --- | --- |
| POST | `/api/admin/uploads/images` | Multipart, campo `image`; 201 com `key`, `previewUrl`, `expiresAt`, `width`, `height`, `bytes`, `contentType`; Location da prévia |
| GET | `/api/admin/uploads/images/:key` | Bytes WebP, `nosniff`, CSP restritiva e `Cache-Control: no-store` |
| DELETE | `/api/admin/uploads/images/:key` | Remove somente staging; 204 idempotente para chave válida ausente |

As três rotas exigem ADMIN com JWT/sessão atual e 2FA. Staging é compartilhado pelos administradores do catálogo, não por clientes/fornecedores. Upload revalida a sessão após processamento e antes de escrever; o processamento/filesystem ficam fora da transação de autenticação. Sem cookie; a prévia deve ser buscada pelo cliente com Authorization e exibida como Blob local. Prévia visual no frontend não implementada nesta tarefa.

POST/DELETE reutilizam limiter de upload (10 por janela configurada, por IP e identidade). Admissão de no máximo dois uploads em andamento por processo, antes de Multer. Falta de capacidade: 503; excesso de requisições: 429. Multipart permite um arquivo, nenhum campo textual, até 5 MiB; parsing limitado a duas partes (o limite de arquivos/campos rejeita a segunda parte de conteúdo). Campo errado/multipart inválido: 400; tamanho excedido: 413; ausência de arquivo: 422; formato/conteúdo incompatível: 415. Sem URLs nem downloads externos.

Assinatura PNG/JPEG/WebP deve corresponder ao MIME, seguida de decodificação Sharp com `failOn: warning`, máximo 16 milhões de pixels, 8192 por eixo, uma página/frame e timeout de processamento de 3 segundos. Reencodificação WebP até 2048 por eixo/5 MiB, orientação corrigida, metadados removidos. Não há preservação dos bytes originais ou nome do cliente. Animações/SVG e formatos não permitidos são recusados.

## Storage e operação

`IMAGE_STAGING_DIR` é um diretório absoluto privado, exclusivo do processo, fora do webroot, com ACL sem execução/sem escrita de terceiros. Desenvolvimento usa `backend/.storage/images`, ignorado pelo Git. Produção sem configuração explícita retorna 503 no upload; `INSTANCE_COUNT > 1` desabilita este storage local até existir provider compartilhado apropriado. Não há `express.static` para uploads. Permissões POSIX 0700/0600 complementam, mas não substituem ACLs do Windows/provisionamento do volume.

UUID v4 gerado no servidor; chave validada antes de acessar arquivos. Escrita exclusiva `.part` seguida de rename para `.webp`. Aborts/erros detectados durante parsing, processamento, escrita ou resposta incompleta removem o arquivo criado; um processo morto abruptamente pode deixar temporário. Arquivos vencem para acesso após 24h; GET remove o vencido solicitado. Novas escritas expurgam staging/temporários com mais de 24h. **Expurgo físico é sob demanda**, não um scheduler de retenção. Quota local de 200 arquivos (até cerca de 1 GiB) impede crescimento ilimitado. Escritas simultâneas ao storage ocupado retornam 503, passível de retry. O volume deve ser dedicado a esta instância; nenhum path/nome original é retornado.

Objetos de staging não são fonte permanente para catálogo. A tarefa 16 deve manter o original até concluir a promoção/associação ou compensar os efeitos de storage explicitamente; uma transação SQL não desfaz arquivos. Origem/CDN de reprodução privada permanece fora desta etapa.

## Arquivos e evidência

Novos: `backend/models/imageStorage.js`, `services/imageProcessor.js`, `services/imageUploadService.js`, `controllers/imageUploadController.js`, `routes/imageUploadRoutes.js`, `scripts/generateImageUploadOpenapi.js`, `tests/imageUpload.test.js` e este documento. Atualizados: `app.js`, `config/env.js`, `middlewares/uploadMiddleware.js`, `.env.example`, `package.json`, `package-lock.json`, `scripts/validateOpenapi.js`, `docs/openapi.json`, `tests/identityFixture.js`, `.gitignore` e continuidade.

- `npm test`: **64/64 aprovados**, incluindo cinco grupos de upload: decoder real, dimensões/pixels/animação/metadados, ADMIN/JWT/TOTP/rate limit, parsing forjado/excessivo, paths, expiração/quota, abort HTTP real e compensação após storage.
- `npm run validate:openapi`: aprovado, **60 operações** (três novas), multipart e prévia binária documentados. Regenerar com `npm run generate:openapi:uploads`.
- `npm install sharp@0.35.5 --save-exact --ignore-scripts`: sucesso; npm/lockfile preservados; auditoria da instalação: **0 vulnerabilidades reportadas**. Binário Sharp instalado e executado nos testes.
- `git diff --check`: sem erros; avisos de conversão LF/CRLF do checkout Windows.
- Fixtures de identidade usam repository simulado explicitamente; processamento, filesystem temporário e interrupção HTTP são reais. Esta tarefa não escreve SQL de domínio e não reaplicou migrations nem repetiu suites MySQL bloqueadas da tarefa 14. Não houve teste visual manual de Swagger/frontend ou validação da ACL/volume de produção.

## Revisão das dependências

Registry consultado nesta rodada: Multer **2.4.0** (já instalado, mantido) e Sharp **0.35.5** (adicionado, Node >=20.9). O [aviso oficial sobre limpeza de uploads abortados](https://github.com/expressjs/multer/security/advisories/GHSA-3p4h-7m6x-2hcm) informa correção na linha estável desde 2.2.0. A versão mantida é posterior; auditoria npm não é garantia de ausência de falhas. Opções de processamento conferidas nas fontes oficiais: [segurança Sharp](https://sharp.pixelplumbing.com/security/), [constructor e limite de pixels](https://sharp.pixelplumbing.com/api-constructor/), [saída e timeout](https://sharp.pixelplumbing.com/api-output/).

Próxima tarefa: **16 — galerias**. Dependências de operação: configurar volume privado de instância única e manter autenticação MySQL disponível. O aceite SQL pendente da tarefa 14 continua registrado, sem ser tratado como teste aprovado.
