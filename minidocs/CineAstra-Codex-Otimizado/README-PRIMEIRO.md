# CineAstra — kit de execução enxuto para Codex

Este pacote reorganiza os prompts anteriores em **52 tarefas delimitadas**,
contrato curto, decisões/progresso e referências consultadas sob demanda.
Contém modelos de instrução, documentação e utilitários Node.js sem dependências.
Não contém a implementação da API nem foi aplicado ao seu repositório.
O objetivo é reduzir releitura, relatórios repetidos e escopo excessivo, mantendo
validações e testes de segurança/integridade. Não garante quantidade de tarefas
por janela de uso e não reinicia a cota de cinco horas.

## 1. Extrair e instalar
Extraia o ZIP em uma pasta separada do projeto. Preserve alterações atuais no Git.
Abra o terminal nessa pasta extraída e execute, com Node.js 18+:

```powershell
node tools/instalar-kit.mjs "C:\caminho\CineAstra" --dry-run
node tools/instalar-kit.mjs "C:\caminho\CineAstra"
```

Substitua o caminho pelo seu projeto. Linux/macOS também aceitam caminho absoluto.
O instalador só adiciona docs/codex, tools/cineastra-task.mjs, AGENTS.template.md
e AGENTS.md se ausentes. Preserva qualquer arquivo existente e mostra conflitos.
Se já há AGENTS.md, incorpore as regras curtas do template; retire obrigações
antigas de ler todos os documentos em toda tarefa que contradigam o novo fluxo.
Confira também instruções globais/nested existentes. O kit não as altera.
Não sobrescreve package.json, .env, código, migrations ou configurações do Codex.
Se interromper instalação, execute novamente: arquivos existentes são preservados.
Para uma atualização do kit, concilie arquivos manualmente; não existe --force.

Instalação manual: copie docs/codex e o helper tools/cineastra-task.mjs para a raiz
do projeto; crie/concilie AGENTS.md usando AGENTS.template.md.
Se backend estiver em subpasta, mantenha o kit na raiz do repositório e solicite
na tarefa00 a identificação dos comandos/caminhos reais. Não mova o backend.

## 2. Primeira rodada
Abra o projeto no Codex e inicie nova sessão após mudar AGENTS.md. Na raiz do projeto:

```powershell
node tools/cineastra-task.mjs prompt 00
```

Cole a saída no Codex. O helper gera texto localmente; não chama a IA.
Peça para executar somente 00. Essa tarefa identifica implementação existente,
versões, commands, integração frontend e schema efetivamente aplicado.
Não apague funcionalidades nem execute o banco completo de referência.

## 3. Rodadas seguintes

```powershell
node tools/cineastra-task.mjs list
node tools/cineastra-task.mjs next
node tools/cineastra-task.mjs show 05
node tools/cineastra-task.mjs prompt 05
```

Copie somente o prompt da tarefa selecionada; o Codex consulta seus arquivos.
Use uma tarefa por vez, com dependências essenciais. Não peça para continuar
automaticamente todas as 52 tarefas na mesma rodada. Se trabalho já existir,
verifique aceite e aproveite-o. Tarefas complexas podem precisar nova divisão
conforme decisões/repositório; pequeno não significa retirar proteção necessária.

O Codex ou você pode registrar o estado:

```powershell
node tools/cineastra-task.mjs status 05 EM_ANDAMENTO
node tools/cineastra-task.mjs status 05 CONCLUIDA "Cadastro integrado e testes aprovados"
node tools/cineastra-task.mjs status 08 BLOQUEADA "Provider de e-mail não configurado"
```

Esses comandos só registram estado; não verificam o código. Marque CONCLUIDA
somente após cumprir aceite e verificar. Decisões/comandos em DECISOES.md;
checkpoint breve em CONTINUIDADE.md; evidências por requisito em COBERTURA.md.
Não armazene credenciais nesses arquivos. Evite dois escritores de progresso
ao mesmo tempo. `next` escolhe ordem numérica, não resolve dependências; tarefas
bloqueadas e marcos49/50 precisam seleção conforme TAREFAS.md.

## 4. Conferir e executar projeto
Revise diff e comandos registrados em DECISOES.md. Scripts npm, porta Swagger,
env e migrations dependem do projeto real e não foram inventados neste kit.
Use banco de desenvolvimento/teste isolado. O helper abaixo verifica somente
estrutura de tarefas, sem instalar pacotes nem testar a API:

```powershell
node tools/cineastra-task.mjs check
```

Rodadas fazem testes pertinentes; marcos49/50 e auditoria51 fazem validação
mais ampla. Imports/rotas/OpenAPI/security da mudança são parte da entrega.
Swagger ajuda a testar manualmente; concorrência precisa integração MySQL.
Gateway/SMTP/CAPTCHA/idade/mídia ausentes são bloqueios reais, não falsos sucessos.

## 5. Ajustar consumo
Use esforço padrão/médio para trabalho rotineiro, conforme opções do cliente.
Escolha modelo adequado à dificuldade; tarefas financeiras e concorrência
merecem mais capacidade. Evite modos de velocidade que consumam mais cota
quando a prioridade for uso. Abra sessão nova quando assunto/contexto acumulado
deixarem de ser úteis; isso não reinicia a janela de uso e pode exigir releitura
do contrato/checkpoint. Não é necessário trocar de sessão a cada comando.
Desative integrações/MCP desnecessárias quando disponíveis; não adicione novas
dependências só para executar o kit. Nunca envie os arquivos de todas tarefas
em cada prompt. Evite pedidos de planos, relatórios e auditoria completos para
uma mudança pequena. Compare consumo antes/depois de tarefas equivalentes;
economia precisa ser observada, não presumida a partir do tamanho dos prompts.

## Arquivos
| Arquivo/pasta | Função |
| --- | --- |
| AGENTS.template.md | Instruções curtas para conciliar na raiz |
| docs/codex/CONTRATO.md | Regras essenciais compartilhadas |
| docs/codex/tasks | 52 entregas com aceite e schemas específicos |
| docs/codex/TAREFAS.md | Índice e ordem/marcos |
| docs/codex/progresso.json | Estado explícito de cada tarefa |
| DECISOES.md / CONTINUIDADE.md / COBERTURA.md | Contexto curto e evidências |
| docs/codex/references | Fontes originais e schemas por tabela |
| docs/codex/PROMPTS-RAPIDOS.md | Começar/retomar/corrigir/revisar |
| tools/cineastra-task.mjs | Listar/selecionar/gerar prompt/registrar status |
| tools/instalar-kit.mjs | Instalar preservando arquivos existentes |

Os arquivos de referência reproduzem as fontes anexadas; schema por tabela
inclui rename nome_cine e campo privado url_reproducao do V4. Confirmar banco real.
RF/RN/RNF são rastreados por tarefa; frontend e infraestrutura têm avaliação própria.

## Referências oficiais
- https://learn.chatgpt.com/docs/pricing
- https://learn.chatgpt.com/docs/models
- https://learn.chatgpt.com/docs/agent-configuration/agents-md

Material organizado em 08/10/2026. Configurações e limites do produto podem mudar;
consulte a documentação/painel vigente se precisar comparar modelos ou cotas.
