// Rebuild offline documentation from the checked-in Markdown sources.
import { readFile, writeFile } from 'node:fs/promises';
import { marked } from 'marked';
const files = ['SPECIFICATION', 'EXECUTION-ALLOCATION-BENCHMARK', 'BYTE-PIPELINE-BENCHMARK', 'MERKLE-TRIE', 'ETHEREUM'];
const escape = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const css = `
:root{color-scheme:dark;--bg:#080e19;--panel:#111b2a;--line:#243447;--ink:#eaf2fa;--muted:#a5b5c7;--mint:#8af0c3}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:28px}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.8 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:var(--mint);text-underline-offset:4px}a:hover{color:white}a:focus-visible{outline:2px solid var(--mint);outline-offset:5px}aside{position:fixed;inset:0 auto 0 0;width:270px;padding:30px 24px;border-right:1px solid var(--line);overflow:auto;background:#0b1320}aside img{width:220px;display:block;margin:0 0 22px}aside .caption,.eyebrow{text-transform:uppercase;letter-spacing:.18em;font-size:11px;font-weight:700;color:var(--mint)}nav a{display:block;text-decoration:none;color:var(--muted);font-size:13px;line-height:1.5;padding:9px 0}nav a.sub{padding-left:14px;font-size:12px}nav a:hover{color:var(--mint)}main{max-width:1220px;margin-left:270px;padding:60px clamp(24px,5vw,84px) 100px}header{border-bottom:1px solid var(--line);padding-bottom:36px;margin-bottom:40px}header .logo{width:min(560px,100%);display:block;margin-bottom:24px}.actions{display:flex;gap:12px;flex-wrap:wrap}.actions a{font-size:12px;border:1px solid var(--line);padding:6px 13px;border-radius:8px;text-decoration:none}h1{font-size:clamp(30px,4vw,48px);letter-spacing:-.04em;line-height:1.15;margin:12px 0 24px}h2{font-size:25px;line-height:1.3;letter-spacing:-.025em;margin-top:58px;padding-top:12px}h3{font-size:19px;margin-top:30px}p,li{color:var(--muted)}strong{color:var(--ink)}li{padding:3px 0}code{font: .86em ui-monospace,SFMono-Regular,Consolas,monospace;background:#172335;border:1px solid #223349;border-radius:5px;padding:2px 5px;overflow-wrap:anywhere}pre{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:22px;overflow:auto;line-height:1.55}pre code{background:none;border:0;padding:0;overflow-wrap:normal}.table-scroll{overflow:auto;border:1px solid var(--line);border-radius:12px;margin:24px 0}table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.6}th{text-align:left;background:#192738;color:var(--mint)}th,td{padding:14px 16px;border-bottom:1px solid var(--line);vertical-align:top}td{color:var(--muted)}tr:last-child td{border-bottom:0}tr:hover td{background:#132033}.flow{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;display:grid;gap:9px}.edge{display:grid;grid-template-columns:1fr .9fr 1fr;align-items:center;gap:12px;font-size:12px;line-height:1.5}.node{padding:10px 12px;border:1px solid #30465a;border-radius:8px;color:var(--ink);background:#0e1927}.arrow{text-align:center;color:var(--mint);font-size:11px}.arrow b{display:block;font-size:20px;line-height:1.2}details{margin-top:16px}summary{color:var(--mint);font-size:12px;cursor:pointer}footer{margin-top:64px;border-top:1px solid var(--line);padding-top:22px;font-size:12px;color:var(--muted)}.skip{position:absolute;top:-90px}.skip:focus{top:10px;left:290px;background:var(--panel);padding:10px;z-index:10}@media(max-width:900px){aside{position:static;width:auto;padding:18px 24px;border-right:0;border-bottom:1px solid var(--line)}aside img{width:165px;margin:0}aside nav,aside .caption{display:none}main{margin:0;padding:30px 22px 60px}h2{margin-top:38px}.edge{grid-template-columns:1fr 70px 1fr;gap:6px}.flow{padding:12px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}@media print{aside,.actions,.skip{display:none}main{margin:0;padding:0;max-width:none}body{background:white;color:#111}p,li,td,footer{color:#333}h1,h2,h3,strong{color:#111}a{color:#175d49}pre,.flow,.node,th{background:#f4f7f8;color:#111}.table-scroll,pre,.flow{break-inside:avoid}header .logo{width:300px}}`;
for (const file of files) {
  const markdown = await readFile(`docs/${file}.md`, 'utf8');
  const toc = [];
  const ids = new Map();
  const renderer = new marked.Renderer();
  renderer.heading = function({tokens, depth}) {
    const text = this.parser.parseInline(tokens);
    const plain = text.replace(/<[^>]*>/g, '').replaceAll('&#39;', "'").replaceAll('&quot;', '"').replaceAll('&amp;', '&');
    const base = plain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g,'');
    const n = ids.get(base) ?? 0; ids.set(base,n+1);
    const id = base + (n ? `-${n}` : '');
    if (depth > 1) toc.push(`<a class="${depth>2?'sub':''}" href="#${id}">${escape(plain)}</a>`);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };
  renderer.code = ({text, lang}) => {
    const source = `<pre><code>${escape(text)}</code></pre>`;
    if (lang !== 'mermaid') return source;
    // Offline rendering of the specification's simple directed flow syntax.
    // Unsupported syntax fails the build instead of silently dropping edges.
    const labels = new Map();
    for (const m of text.matchAll(/(\w+)\[([^\]]+)\]/g)) labels.set(m[1],m[2]);
    const edges = text.split('\n').map(s=>s.trim()).filter(s=>s && !s.startsWith('flowchart ')).map(line=>{
      const m = line.match(/^(\w+)(?:\[[^\]]+\])?\s*-->(?:\|([^|]+)\|)?\s*(\w+)(?:\[[^\]]+\])?$/);
      if (!m) throw new Error(`Unsupported flow syntax: ${line}`);
      return `<div class="edge"><div class="node">${escape(labels.get(m[1])??m[1])}</div><div class="arrow">${escape(m[2]??'')}<b aria-label="to">→</b></div><div class="node">${escape(labels.get(m[3])??m[3])}</div></div>`;
    });
    return `<div class="flow" aria-label="Architecture data flow">${edges.join('')}</div><details><summary>View Mermaid source</summary>${source}</details>`;
  };
  let body = marked.parse(markdown,{renderer});
  for (const target of files) body = body.replaceAll(`href="${target}.md"`, `href="${target}.html"`);
  body = body.replaceAll('<table>','<div class="table-scroll"><table>').replaceAll('</table>','</table></div>');
  const title = markdown.split('\n')[0].replace(/^# /,'');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Super Frontier Chain — architecture, protocol and measured performance."><title>${escape(title)} · SFC</title><style>${css}</style></head><body><a class="skip" href="#content">Skip to content</a><aside><a href="SPECIFICATION.html"><img src="assets/sfc-logo.png" alt="SFC — Super Frontier Chain"></a><p class="caption">On this page</p><nav aria-label="Table of contents">${toc.join('')}</nav></aside><main id="content"><header><img class="logo" src="assets/sfc-logo.png" alt="Super Frontier Chain"><div class="eyebrow">Engineering documentation / SFC</div><p>Architecture. Execution. Evidence.</p><div class="actions"><a href="${file}.md">Markdown source ↗</a><a href="SPECIFICATION.html">Specification</a><a href="EXECUTION-ALLOCATION-BENCHMARK.html">Benchmarks</a><a href="ETHEREUM.html">Ethereum compatibility</a></div></header><article>${body}</article><footer>Super Frontier Chain · Generated from ${escape(file)}.md · Rebuild: npm run build:docs<br>Static, offline-readable documentation. No external scripts, fonts or trackers.</footer></main></body></html>\n`;
  await writeFile(`docs/${file}.html`, html);
  console.log(`docs/${file}.html`);
}
