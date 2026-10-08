#!/usr/bin/env node
import {readFileSync, writeFileSync, renameSync, unlinkSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const path = resolve(root, 'docs/codex/progresso.json');
const states = ['PENDENTE','EM_ANDAMENTO','CONCLUIDA','BLOQUEADA'];
const [command = 'help', rawId, state, ...note] = process.argv.slice(2);
const usage = `Uso (na raiz do projeto):
  node tools/cineastra-task.mjs list
  node tools/cineastra-task.mjs next
  node tools/cineastra-task.mjs show 05
  node tools/cineastra-task.mjs prompt 05
  node tools/cineastra-task.mjs status 05 EM_ANDAMENTO
  node tools/cineastra-task.mjs status 05 CONCLUIDA "Testes de cadastro aprovados"
  node tools/cineastra-task.mjs status 05 BLOQUEADA "Banco de teste indisponível"
  node tools/cineastra-task.mjs check
Nenhum comando chama IA, instala pacotes, altera backend ou executa SQL.
status apenas registra a avaliação do operador; não certifica implementação.`;

try {
  if (command === 'help' || command === '--help') {console.log(usage); process.exit(0);}
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(data.tarefas)) throw new Error('progresso.json inválido');
  const findTask = () => {
    if (!/^\d{1,2}$/.test(rawId ?? '')) throw new Error('Informe um ID numérico, por exemplo 05');
    const t = data.tarefas.find(x => x.id === rawId.padStart(2, '0'));
    if (!t) throw new Error('Tarefa inexistente');
    return t;
  };
  const taskPath = t => {
    if (!/^docs\/codex\/tasks\/[a-z0-9-]+\.md$/.test(t.arquivo)) throw new Error('Caminho inválido de tarefa');
    return resolve(root, t.arquivo);
  };
  if (command === 'list') {
    for (const t of data.tarefas) console.log(`${t.id}  ${t.estado.padEnd(12)}  ${t.titulo}`);
  } else if (command === 'next') {
    const t = data.tarefas.find(x => x.estado === 'EM_ANDAMENTO') ?? data.tarefas.find(x => x.estado === 'PENDENTE');
    if (t) console.log(`${t.id} — ${t.titulo}\nArquivo: ${t.arquivo}\nPrompt: node tools/cineastra-task.mjs prompt ${t.id}`);
    else console.log('Nenhuma pendente/em andamento; confira as bloqueadas com list.');
  } else if (command === 'show') {
    console.log(readFileSync(taskPath(findTask()), 'utf8'));
  } else if (command === 'prompt') {
    const t = findTask();
    taskPath(t);
    console.log(`Execute somente a tarefa ${t.id}: ${t.titulo}.
Leia AGENTS.md, docs/codex/DECISOES.md e docs/codex/CONTINUIDADE.md.
Leia docs/codex/CONTRATO.md se ainda não foi lido nesta sessão.
Tarefa: ${t.arquivo}
Consulte somente os trechos e arquivos necessários ao trabalho.
Implemente no projeto existente, verifique o aceite e atualize OpenAPI quando afetado.
Registre estado real em progresso.json e próximo passo em CONTINUIDADE.md.
Conclua esta tarefa, reporte resultado/testes/bloqueios em até 10 linhas e pare.
Se já estiver implementada, confira o aceite e registre sem recriar.`);
  } else if (command === 'status') {
    const t = findTask();
    if (!states.includes(state)) throw new Error(`Estado deve ser: ${states.join(', ')}`);
    t.estado = state; t.observacao = note.join(' '); t.atualizado_em = new Date().toISOString();
    const temp = path + `.tmp-${process.pid}`;
    try {writeFileSync(temp, JSON.stringify(data, null, 2) + '\n', {encoding:'utf8',flag:'wx'}); renameSync(temp, path);}
    finally {try {unlinkSync(temp);} catch(e) {if(e.code !== 'ENOENT') throw e;}}
    console.log(`${t.id}: ${state}`);
  } else if (command === 'check') {
    const seen = new Set();
    for (const t of data.tarefas) {
      if (seen.has(t.id) || !states.includes(t.estado)) throw new Error('ID duplicado ou estado inválido');
      seen.add(t.id);
      const text = readFileSync(taskPath(t), 'utf8');
      if (!text.includes(`# ${t.id} — `)) throw new Error(`Título inválido: ${t.id}`);
    }
    console.log(`Kit consistente: ${data.tarefas.length} tarefas. Backend não foi testado por este comando.`);
  } else throw new Error('Comando desconhecido.\n' + usage);
} catch(e) {console.error(`Erro: ${e.message}`); process.exitCode = 1;}
