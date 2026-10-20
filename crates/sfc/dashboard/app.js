import { animate } from 'motion';
import * as THREE from 'three';

const $ = id => document.getElementById(id);
const fmt = n => Number(n).toLocaleString(undefined, {maximumFractionDigits: 2});
const short = s => s ? s.slice(0, 10) + '…' + s.slice(-6) : '—';
const text = (id, value) => { $(id).textContent = value; };
const element = (tag, value, cls) => { const e = document.createElement(tag); if(value != null)e.textContent = value; if(cls)e.className = cls; return e; };
const link = (label, href, cls='hash-link') => { const e=element('a',label,cls);e.href=href;return e; };
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let motionOn = !reduced.matches, currentPage = 'overview', stats = null, indexStats = null;
let explorerRows=[], explorerNext=null, explorerVersion=0, logBefore=null, logVersion=0, detailVersion=0;
let explorerKind='transactions', explorerQuery='', logQuery='';
let blockPickerLoaded=false, blockPickerVersion=0, selectedBlock=null, selectionVersion=0;
async function loadBlockPicker(autoSelect=false) {
  const version=++blockPickerVersion, selection=selectionVersion;
  $('refresh-block-picker').disabled=true;
  try {
    const result=await index({kind:'blocks_with_transactions',limit:30});
    if(version!==blockPickerVersion)return;
    const picker=$('block-picker'), previous=picker.value;
    picker.replaceChildren(new Option('Choose a block…',''));
    for(const b of result.rows)picker.add(new Option(`#${fmt(b.height)} · ${fmt(b.transactionCount)} transactions`,String(b.height)));
    picker.value=previous;
    blockPickerLoaded=true;
    text('block-picker-status',result.rows.length?'Select a block to display its transactions below.':'No populated blocks indexed yet. Refresh after transactions commit.');
    if(autoSelect&&selection===selectionVersion&&result.rows.length)selectBlock(String(result.rows[0].height));
  } catch {text('block-picker-status','Could not load blocks. Check the node and refresh.');}
  finally {if(version===blockPickerVersion)$('refresh-block-picker').disabled=false;}
}
async function selectBlock(height) {
  const version=++selectionVersion;
  // Invalidate any pending transaction search before fetching this block.
  explorerVersion++; selectedBlock=null;
  text('selected-block-title',`2. Transactions · Block #${height}`);
  text('selected-block-summary','Loading block…');
  $('selected-block-details').hidden=true;
  empty($('explorer-results'),'Loading transactions…','Reading the selected block.');
  $('explorer-more').hidden=true;
  try {
    const result=await index({kind:'blocks',q:height,limit:1});
    if(version!==selectionVersion)return;
    const block=result.rows[0];
    if(!block){text('selected-block-summary','This block is not indexed yet.');empty($('explorer-results'),'Block not indexed','Choose a recent block above or refresh after the index catches up.');return;}
    selectedBlock=block;
    $('block-height').value=String(block.height);
    $('block-picker').value=String(block.height);
    $('selected-block-details').href='#block/'+block.height;
    $('selected-block-details').hidden=false;
    text('selected-block-title',`2. Transactions · Block #${fmt(block.height)}`);
    text('selected-block-summary',`${fmt(block.transactionCount)} transactions · Click a transaction hash to view its details and receipt.`);
    $('explorer-kind').value='transactions';$('explorer-query').value=String(block.height);
    await searchExplorer(false,true);
  } catch {if(version===selectionVersion){text('selected-block-summary','Block unavailable. Please retry.');empty($('explorer-results'),'Could not load block','Check the node connection and try again.');}}
}
const counters = new Map();
function tween(id,value,suffix='') {
  const e=$(id), old=counters.get(id);old?.animation?.stop();
  if(value == null || !Number.isFinite(Number(value))){e.textContent='—';counters.delete(id);return;}
  const target=Number(value), state={value:target};
  if(motionOn && old && old.value !== target)state.animation=animate(old.value,target,{duration:.5,ease:'easeOut',onUpdate:v=>{e.textContent=fmt(id==='height'||id==='transaction-total'?Math.round(v):v)+suffix;}});
  else e.textContent=fmt(target)+suffix;
  counters.set(id,state);
}
function properties(target, entries) {
  target.replaceChildren();
  for(const [name,value] of entries){target.append(element('dt',name),element('dd',value instanceof Node?'':value==null?'Unavailable':typeof value==='object'?JSON.stringify(value):String(value)));if(value instanceof Node)target.lastChild.append(value);}
}
function table(headers, rows) {
  const t=element('table'),head=element('thead'),tr=element('tr');headers.forEach(v=>tr.append(element('th',v)));head.append(tr);t.append(head);
  const body=element('tbody');for(const row of rows){const r=element('tr');for(const v of row){const td=element('td');td.append(v instanceof Node?v:document.createTextNode(String(v??'—')));r.append(td);}body.append(r);}t.append(body);return t;
}
function badge(label,kind=''){return element('span',label,'badge '+kind);}
function empty(target,title,message){target.replaceChildren();const box=element('div',null,'empty-state');box.append(element('strong',title),element('p',message));target.append(box);}
function txTable(rows,compact=false){return table(compact?['Transaction','Block','Value','Status']:['Transaction hash','Block / index','From → To','Value','Status'],rows.map(r=>{
  const cells=[link(short(r.hash),'#tx/'+r.hash),link(String(r.height)+(compact?'':' / '+r.position),'#block/'+r.height,'block-link')];
  if(!compact)cells.push(short(r.receipt.from)+' → '+(r.receipt.to?short(r.receipt.to):'Contract creation'));
  cells.push(r.transaction.valueWei+' wei',badge(r.receipt.success?'Success':'Reverted',r.receipt.success?'':'error'));return cells;
}));}
function blockTable(rows){return table(['Block','Transactions','Gas used','Time'],rows.map(b=>[
  link('#'+fmt(b.height),'#block/'+b.height,'block-link'),b.transactions?link(fmt(b.transactions)+' txs','#block/'+b.height):badge('Empty block','empty'),
  b.gasUsed==null?'—':fmt(b.gasUsed),new Date(b.timestamp*1000).toLocaleTimeString()
]));}
async function api(path,params){const response=await fetch(path+(params?'?'+new URLSearchParams(params):''),{cache:'no-store',signal:AbortSignal.timeout(6000)});if(!response.ok)throw Error(`API returned ${response.status}`);return response.json();}
const index = params => api('/dashboard/index',params);
function renderIndex(s){indexStats=s;tween('transaction-total',s.indexedTransactions);text('index-lag',`SQLite ${s.journalMode.toUpperCase()} · indexed block ${fmt(s.indexedHeight)}`);properties($('index-details'),[
  ['Schema version',s.schemaVersion??'Unversioned'],['Journal mode',s.journalMode.toUpperCase()],['Indexed height',fmt(s.indexedHeight)],['Last sampled head',stats?fmt(stats.height):'—'],['Indexed transactions',fmt(s.indexedTransactions)],['Indexed logs',fmt(s.indexedLogs)],['Pruned blocks skipped',s.skippedPrunedBlocks],['Health',s.error||'Index available'],['Database',s.database]
]);}
function renderStats(s){stats=s;tween('height',s.height);tween('tps',s.tps);tween('cpu',s.host?.cpuPercent,'%');text('head-age',`Head age ${Math.max(0,Math.floor(Date.now()/1000)-s.headTimestamp)}s · chain ${s.chainId}`);text('tps-window',`${fmt(s.windowTransactions)} txs / ${s.windowSeconds}s block window`);text('hero-backend',s.verification.backend.toUpperCase());text('engine-backend',s.verification.backend);text('gpu-records',fmt(s.verification.gpu_records));text('cpu-records',fmt(s.verification.cpu_records));text('pending',fmt(s.pendingTransactions));text('rayon',s.host?.rayonThreads??'—');text('block-interval',`Target ${s.targetBlockMs} ms`);document.querySelectorAll('[data-chain]').forEach(e=>e.textContent=s.chainId);
  $('latest-blocks').replaceChildren(blockTable(s.recentBlocks));
  const host=s.host||{};text('cpu-sample',host.sampleSeconds?`${host.sampleSeconds.toFixed(1)}s SAMPLE`:'SAMPLING');
  $('processes').replaceChildren(table(['Process','PID','CPU','Resident memory','OS threads'],(host.processes||[]).map(p=>[p.role,p.pid,p.cpuPercent==null?'Sampling…':p.cpuPercent.toFixed(1)+'%',(p.residentBytes/1048576).toFixed(1)+' MiB',p.osThreads??'Unavailable'])));
  properties($('worker-details'),[['Backend',s.verification.backend],['GPU recoveries',fmt(s.verification.gpu_records)],['CPU recoveries',fmt(s.verification.cpu_records)],['Rayon threads',host.rayonThreads],['Logical CPU cores',host.logicalCpus],['Indexer threads',host.indexerThreads],['Hardware GPU utilization','Not sampled']]);
  properties($('node-details'),[['Role',s.role],['Chain ID',s.chainId],['Pending transactions',s.pendingTransactions],['Target block interval',s.targetBlockMs+' ms'],['Retention',s.retention],['Retained blocks',s.retainedBlocks],['Upstream',s.upstream||'None configured'],['Sync transport',s.syncTransport],['Head hash',s.headHash]]);
  properties($('rocksdb'),Object.entries(s.rocksdb||{}).map(([k,v])=>[k.replace('rocksdb.',''),v==null?'Unavailable':fmt(v)]));properties($('paths'),[...Object.entries(s.endpoints||{}),...Object.entries(s.paths||{})]);properties($('runtime'),[...Object.entries(s.runtime||{}),...Object.entries(s.stress||{})]);drawChart(s.recentBlocks);
}
function drawChart(blocks){const svg=$('activity-chart'),values=[...blocks].reverse(),max=Math.max(1,...values.map(b=>b.transactions));text('chart-max',fmt(Math.max(...values.map(b=>b.transactions),0)));svg.replaceChildren();const ns='http://www.w3.org/2000/svg';for(let y=0;y<180;y+=45){const line=document.createElementNS(ns,'line');for(const[k,v]of Object.entries({x1:0,x2:900,y1:y,y2:y,stroke:'#223145','stroke-dasharray':'3 6'}))line.setAttribute(k,v);svg.append(line);}
  values.forEach((b,i)=>{const a=document.createElementNS(ns,'a');a.setAttribute('href','#block/'+b.height);const rect=document.createElementNS(ns,'rect'),w=900/values.length,h=b.transactions/max*160;for(const[k,v]of Object.entries({x:i*w+7,y:175-Math.max(2,h),width:Math.max(2,w-14),height:Math.max(2,h),rx:4,fill:b.transactions?'#87dabb':'#293e4f'}))rect.setAttribute(k,v);const title=document.createElementNS(ns,'title');title.textContent=`Block ${b.height}: ${b.transactions} transactions`;rect.append(title);a.append(rect);svg.append(a);});}
function showPage(page){const names={overview:'Overview',explorer:'Chain explorer',node:'Compute & workers',storage:'Storage & paths',logs:'Event logs'};if(!names[page])page='overview';const changed=currentPage!==page;currentPage=page;text('page-title',names[page]);for(const e of document.querySelectorAll('[data-page]'))e.hidden=e.dataset.page!==page;for(const e of document.querySelectorAll('[data-nav]'))e.classList.toggle('active',e.dataset.nav===page);if(changed){scrollTo({top:0,behavior:'instant'});if(motionOn)animate(document.querySelector(`[data-page="${page}"]`),{opacity:[0,1],y:[8,0]},{duration:.25});}}
function goSearch(kind,q=''){ $('explorer-kind').value=kind;$('explorer-query').value=q;location.hash='explorer';showPage('explorer');searchExplorer();}
async function searchExplorer(more=false,fromPicker=false){if(!more&&!fromPicker){selectionVersion++;selectedBlock=null;$('block-picker').value='';text('selected-block-title','2. Transactions & search results');text('selected-block-summary','Click a block or transaction to inspect its details.');$('selected-block-details').hidden=true;}const version=++explorerVersion;const kind=more?explorerKind:$('explorer-kind').value,q=more?explorerQuery:$('explorer-query').value.trim();if(!more){explorerKind=kind;explorerQuery=q;explorerRows=[];explorerNext=null;empty($('explorer-results'),'Loading…','Reading committed records from SQLite.');}$('explorer-more').disabled=true;
  try{const result=await index({kind,q,limit:50,...(more?explorerNext:{})});if(version!==explorerVersion)return;explorerRows.push(...result.rows);explorerNext=result.next;renderIndex(result);text('explorer-context',`${fmt(explorerRows.length)} ${kind}${q?' · '+short(q):' · latest indexed'}`);if(!explorerRows.length)empty($('explorer-results'),'No indexed matches','An empty block has no transactions. If the block just committed, allow the index to catch up.');else $('explorer-results').replaceChildren(kind==='blocks'?blockTable(explorerRows):txTable(explorerRows));$('explorer-more').hidden=!explorerNext;
    if(selectedBlock&&selectedBlock.transactionCount===0)empty($('explorer-results'),`Block #${fmt(selectedBlock.height)} is empty`,'Choose a block from “Blocks with transactions” above to see transactions immediately.');
  }catch{if(version===explorerVersion)empty($('explorer-results'),'Search unavailable','The node may be stopped, or the index may still be opening. Try again.');}finally{if(version===explorerVersion)$('explorer-more').disabled=false;}}
function detailProperties(entries){const dl=element('dl',null,'properties detail-properties');properties(dl,entries);return dl;}
function disclosure(title,value){const d=element('details'),summary=element('summary',title,'detail-section-title');d.append(summary,element('pre',typeof value==='string'?value:JSON.stringify(value,null,2),'json'));return d;}
let toastTimer;
function copyButton(value){const b=element('button','Copy','icon-button');b.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(value);text('toast','Copied to clipboard');}catch{text('toast','Could not copy. Select the text to copy manually.');}$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,2200);});return b;}
function detailHeader(label,title,hash){const wrapper=element('div',null,'detail-heading');wrapper.append(element('div',label,'eyebrow'));const h=element('h2',title);h.id='detail-title';wrapper.append(h);if(hash){const row=element('div',null,'detail-hash');row.append(element('code',hash),copyButton(hash));wrapper.append(row);}return wrapper;}
async function openDetail(kind,key){const version=++detailVersion,dialog=$('detail-dialog'),container=$('detail-content');container.replaceChildren(detailHeader('LOADING',kind==='block'?'Block '+key:'Transaction'));if(!dialog.open){dialog.showModal();if(motionOn)animate(dialog,{x:[35,0],opacity:[0,1]},{duration:.25});}dialog.scrollTop=0;
  try{const result=await index({kind:kind==='block'?'blocks':'transactions',q:key,limit:1});if(version!==detailVersion)return;const row=result.rows[0];if(!row){container.replaceChildren(detailHeader('NOT INDEXED',kind==='block'?'Block '+key:'Transaction'));container.append(element('p','No indexed record yet. The index may be catching up, or this record may predate retained history.','empty-explainer'));return;}
    if(kind==='block'){const count=row.transactionCount??row.transactions;container.replaceChildren(detailHeader('COMMITTED BLOCK','Block #'+fmt(row.height),row.hash));container.append(detailProperties([['Transaction count',count===0?'0 · Empty block':fmt(count)],['Timestamp',new Date(row.timestamp*1000).toLocaleString()],['Parent hash',link(short(row.parentHash),'#block/'+row.parentHash)],['State root',row.stateRoot]]));
      const title=element('h3',`Transactions (${fmt(count)})`,'detail-section-title');container.append(title);
      if(count===0){const info=element('div',null,'empty-explainer');info.append(element('strong','This is an empty block.'),document.createTextNode('No transactions were included when this block was produced. The sequencer continues producing blocks while the stress generator prepares the next batch. This is not a missing transaction list.'));container.append(info);const button=element('button','Browse recent transactions ↗','button primary mt-5');button.onclick=()=>goSearch('transactions');container.append(button);}
      else{const txs=element('div',null,'table-scroll'),more=element('button','Load more transactions ↓','button mt-5');container.append(txs,more);let cursor=null,rows=[],loading=false;const load=async()=>{if(loading)return;loading=true;more.disabled=true;try{const page=await index({kind:'transactions',q:String(row.height),limit:50,...(cursor||{})});if(version!==detailVersion)return;rows.push(...page.rows);cursor=page.next;title.textContent=`Transactions (${fmt(rows.length)} of ${fmt(count)})`;txs.replaceChildren(txTable(rows));more.hidden=!cursor;}catch{more.textContent='Retry loading transactions';}finally{loading=false;more.disabled=false;}};more.onclick=load;await load();}
      container.append(disclosure('Block metadata', {...row,transactions:undefined,transactionCount:count}));
    }else{const t=row.transaction,r=row.receipt;container.replaceChildren(detailHeader('SIGNED TRANSACTION','Transaction details',row.hash));container.append(detailProperties([['Status',badge(r.success?'Success':'Reverted',r.success?'':'error')],['Block',link('#'+fmt(row.height),'#block/'+row.height,'block-link')],['Position in block',row.position],['From',r.from],['To',r.to||'Contract creation'],['Value',t.valueWei+' wei'],['Nonce',t.nonce],['Type',t.type===2?'EIP-1559 (type 2)':'Legacy (EIP-155)'],['Chain ID',t.chainId],['Gas used',fmt(r.gas_used)],['Gas limit',t.gasLimit],['Gas price / max fee',t.gasPriceWei+' wei'],['Contract created',r.contract_address||'None']]));container.append(disclosure('Input data',t.input),disclosure(`Receipt · ${r.logs.length} event logs`,r),disclosure('Raw signed transaction',row.raw));}
  }catch{if(version===detailVersion)container.replaceChildren(detailHeader('UNAVAILABLE','Could not load details'),element('p','The node may be stopped. Close and reopen this record to retry.','empty-explainer'));}}
function route(){const hash=decodeURIComponent(location.hash.slice(1)||'overview');if(hash.startsWith('block/')||hash.startsWith('tx/')){const [kind,...rest]=hash.split('/');openDetail(kind,rest.join('/'));return;}detailVersion++;if($('detail-dialog').open)$('detail-dialog').close();showPage(hash);if(currentPage==='explorer'){if(!blockPickerLoaded)loadBlockPicker(!explorerRows.length&&!explorerQuery);else if(!explorerRows.length&&!selectedBlock)searchExplorer();}if(currentPage==='logs')searchLogs();}
function closeDetail(){location.hash=currentPage;}
async function searchLogs(more=false){const version=++logVersion;if(!more){logQuery=$('log-query').value.trim();logBefore=null;}$('logs-more').disabled=true;try{const result=await index({kind:'logs',q:logQuery,limit:50,...(more&&logBefore?{before:logBefore}:{})});if(version!==logVersion)return;renderIndex(result);if(!more)$('logs-results').replaceChildren();for(const row of result.rows){const d=element('details',null,'log-record'),summary=element('summary');summary.append(element('time',new Date(row.record.timestamp_ms).toLocaleString()),badge(row.record.level,row.record.level==='error'?'error':''),element('strong',row.record.event));d.append(summary,element('pre',JSON.stringify(row.record,null,2),'json'));d.addEventListener('toggle',()=>{if(d.open)$('live-logs').checked=false;});$('logs-results').append(d);}logBefore=result.rows.at(-1)?.id; $('logs-more').hidden=result.rows.length<50;text('log-status',`${fmt(result.indexedLogs)} indexed events · SQLite ${result.journalMode.toUpperCase()}`);if(!more&&!result.rows.length)empty($('logs-results'),'No matching events','Try an event name, level, or message word.');}catch{text('log-status','Log index unavailable · data may be stale');}finally{$('logs-more').disabled=false;}}
async function refresh(){if(!document.hidden){try{const [s,t]=await Promise.all([api('/dashboard/stats'),index({kind:'transactions',limit:6})]);renderStats(s);renderIndex(t);if(t.rows.length)$('latest-transactions').replaceChildren(txTable(t.rows,true));else empty($('latest-transactions'),'No transactions yet','Transactions appear here once a block is indexed.');text('connection','● Node online');$('connection').classList.remove('stale');text('updated',`Updated ${new Date().toLocaleTimeString()} · every 2s`);if(currentPage==='logs'&&$('live-logs').checked&&!$('detail-dialog').open)await searchLogs();}catch{text('connection','Node unavailable');$('connection').classList.add('stale');text('updated','Connection lost · displayed data may be stale');}}setTimeout(refresh,2000);}
$('explorer-form').onsubmit=e=>{e.preventDefault();searchExplorer();};$('explorer-more').onclick=()=>searchExplorer(true);$('recent-txs').onclick=()=>goSearch('transactions');$('recent-blocks').onclick=()=>goSearch('blocks');$('browse-blocks').onclick=()=>goSearch('blocks');$('logs-form').onsubmit=e=>{e.preventDefault();$('live-logs').checked=false;searchLogs();};$('logs-more').onclick=()=>{$('live-logs').checked=false;searchLogs(true);};$('close-detail').onclick=closeDetail;$('detail-dialog').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});$('detail-dialog').addEventListener('click',e=>{if(e.target===$('detail-dialog')&&e.clientX<$('detail-dialog').getBoundingClientRect().left)closeDetail();});addEventListener('hashchange',route);
$('block-picker').onchange=e=>{if(e.target.value)selectBlock(e.target.value);};
$('block-jump-form').onsubmit=e=>{e.preventDefault();selectBlock($('block-height').value.trim());};
$('refresh-block-picker').onclick=()=>loadBlockPicker(!selectedBlock&&!explorerQuery);
// Decorative Three.js orbit: bounded geometry, 20 FPS, no work in hidden tabs or other pages.
function orbit(){const canvas=$('orbit');try{const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,30);camera.position.z=6;const group=new THREE.Group();const material=new THREE.LineBasicMaterial({color:0x9be2cb,transparent:true,opacity:.24});const geometry=new THREE.EdgesGeometry(new THREE.TorusGeometry(1.45,.22,8,60));group.add(new THREE.LineSegments(geometry,material));group.rotation.x=.9;group.rotation.z=-.4;scene.add(group);let last=0;const resize=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}});resize.observe(canvas);let frame;function draw(now){frame=requestAnimationFrame(draw);if(!motionOn||document.hidden||currentPage!=='overview'||$('detail-dialog').open||now-last<50)return;last=now;group.rotation.y=now*.00006;renderer.render(scene,camera);}frame=requestAnimationFrame(draw);addEventListener('pagehide',()=>{cancelAnimationFrame(frame);resize.disconnect();geometry.dispose();material.dispose();renderer.dispose();},{once:true});}catch{canvas.hidden=true;}}
function updateMotion(){text('motion-toggle',motionOn?'Motion on':'Motion off');$('motion-toggle').setAttribute('aria-pressed',String(motionOn));$('orbit').hidden=!motionOn;}
$('motion-toggle').onclick=()=>{motionOn=!motionOn;updateMotion();};reduced.addEventListener('change',e=>{motionOn=!e.matches;updateMotion();});updateMotion();route();orbit();refresh();
