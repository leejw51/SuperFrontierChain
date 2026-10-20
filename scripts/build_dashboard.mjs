import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await build({entryPoints:[path.join(root,'crates/sfc/dashboard/app.js')],bundle:true,minify:true,format:'esm',target:'es2022',outfile:path.join(root,'crates/sfc/static/dashboard.js'),legalComments:'linked'});
execFileSync(process.execPath,[path.join(root,'node_modules/@tailwindcss/cli/dist/index.mjs'),'-i',path.join(root,'crates/sfc/dashboard/styles.css'),'-o',path.join(root,'crates/sfc/static/dashboard.css'),'--minify'],{cwd:root,stdio:'inherit'});
