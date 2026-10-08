#!/usr/bin/env node
import {existsSync, lstatSync, readdirSync, mkdirSync, copyFileSync, readFileSync, constants, realpathSync} from 'node:fs';
import {dirname, resolve, join, relative, isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('Uso: node tools/instalar-kit.mjs "CAMINHO_DO_PROJETO" [--dry-run]\nPreserva todos os arquivos existentes. Não instala dependências nem executa SQL.');
  process.exit(args.length ? 0 : 1);
}
try {
  const target = resolve(args[0]); const dry = args.includes('--dry-run');
  if (args.slice(1).some(x => x !== '--dry-run')) throw new Error('Opção desconhecida');
  if (!existsSync(target) || !lstatSync(target).isDirectory()) throw new Error('A pasta do projeto deve existir');
  const inside = relative(realpathSync(source), realpathSync(target));
  if (!inside || (!inside.startsWith('..') && !isAbsolute(inside))) throw new Error('Destino precisa estar fora da pasta deste kit');
  function walk(dir) {
    return readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(join(dir,e.name)) : [join(dir,e.name)]);
  }
  let created = 0, skipped = 0;
  function copy(src, rel) {
    const dest = resolve(target, rel);
    let current = target;
    for (const part of relative(target, dirname(dest)).split(/[\/\\]/).filter(Boolean)) {
      current = join(current,part);
      if (existsSync(current) && (lstatSync(current).isSymbolicLink() || !lstatSync(current).isDirectory())) throw new Error(`Diretório inseguro/incompatível: ${current}`);
    }
    if (existsSync(dest)) {console.log(`PRESERVADO ${rel}`); skipped++; return;}
    if (!dry) {mkdirSync(dirname(dest),{recursive:true}); copyFileSync(src,dest,constants.COPYFILE_EXCL);}
    console.log(`${dry ? 'PREVISTO' : 'CRIADO'} ${rel}`); created++;
  }
  for (const dir of ['docs/codex']) for (const f of walk(join(source,dir))) copy(f,relative(source,f));
  copy(join(source,'tools/cineastra-task.mjs'),'tools/cineastra-task.mjs');
  copy(join(source,'AGENTS.template.md'),'AGENTS.template.md');
  copy(join(source,'AGENTS.template.md'),'AGENTS.md');
  console.log(`\n${created} ${dry ? 'previstos' : 'criados'}; ${skipped} preservados.`);
  if (existsSync(join(target,'AGENTS.md'))) console.log('Confira AGENTS.md e concilie com AGENTS.template.md se necessário.');
  console.log('Início: node tools/cineastra-task.mjs prompt 00 (a partir do projeto).');
} catch(e) {console.error(`Erro: ${e.message}`);process.exitCode=1;}
