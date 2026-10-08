# Cobertura de requisitos

Atualize linhas afetadas por tarefa; não reescreva uma matriz completa a cada rodada.
Não considere frontend/infraestrutura implementados somente por existir endpoint.

| Requisito | Tarefa | Estado | Arquivo/rota | Teste/evidência | Bloqueio |
| --- | --- | --- | --- | --- | --- |
| A preencher conforme implementação | 00 | Pendente | — | — | Diagnóstico |
| RF45 filmes/gêneros | 14 | Implementado; aceite SQL bloqueado | backend/catalog*.js; /api/films, /api/genres e /api/admin | 59 testes totais; 18 operações OpenAPI | MySQL dev/test isolado ausente |
| RF08 metadados (parcial) | 14 | Catálogo; sem compra/playback | DTO público sem url_reproducao; filtros e preços | catalog.test.js | Playback/compra pertencem a etapas futuras |
| RNF05 upload/prévia backend | 15 | CONCLUIDA no backend de staging | /api/admin/uploads/images; imageUpload*.js | 64/64 totais; decoder/filesystem/abort HTTP reais | Prévia visual frontend fora de escopo; galeria na 16 |
| RNF17 controles de upload | 15 | CONCLUIDA no módulo | ADMIN/2FA/limiter, assinatura, Sharp, paths e cleanup | Multipart falso/excessivo/abortado; dimensões/animação/quota | Produção exige volume privado de instância única |
