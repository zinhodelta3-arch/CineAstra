// Correção para next-themes 0.4.6 com o React incluído no Next 16.3.6.
// A inicialização é feita por AppearanceInitializer e pelos efeitos do provedor.
const fs = require("node:fs");
const path = require("node:path");

const dist = path.dirname(require.resolve("next-themes"));
const metadata = JSON.parse(fs.readFileSync(path.join(dist, "..", "package.json"), "utf8"));
if (metadata.version !== "0.4.6") {
  throw new Error("Esta correção foi validada para next-themes 0.4.6. Execute npm install com o package.json fornecido.");
}

const marker = "/* cineastra: disable inline ThemeScript */";
const guard = `${marker}return null;`;
const signature = /(\b[\w$]+\.memo\(\(\{[^}]*\bscriptProps:[^}]*\}\)=>\{)(?=let [\w$]+=JSON\.stringify\()/g;
const updates = [];

for (const filename of ["index.js", "index.mjs"]) {
  const file = path.join(dist, filename);
  const source = fs.readFileSync(file, "utf8");
  if (source.includes(guard)) continue;
  const matches = [...source.matchAll(signature)];
  if (matches.length !== 1) {
    throw new Error(`Não foi possível localizar ThemeScript em ${filename}. Nenhum arquivo foi alterado.`);
  }
  updates.push({ file, source: source.replace(signature, `$1${guard}`) });
}

for (const update of updates) {
  fs.writeFileSync(update.file, update.source, "utf8");
}
console.log(updates.length ? "Correção CineAstra aplicada ao next-themes." : "Correção CineAstra já aplicada ao next-themes.");
