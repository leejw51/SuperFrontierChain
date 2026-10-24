import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../crates/sfc/dashboard/app.js',import.meta.url),'utf8');
const refresh=source.slice(source.indexOf('async function refresh()'),source.indexOf("$('explorer-form').onsubmit"));
for(const mode of ['off','index-failure','on','node-failure']){
  const labels={},calls=[];
  const context={document:{hidden:false},Date,currentPage:'overview',stats:null,
    $:()=>({classList:{add(){},remove(){}},replaceChildren(){}}),
    text:(id,value)=>labels[id]=value,
    api:async()=>{if(mode==='node-failure')throw Error('offline');return {height:42,runtime:{sqliteIndexerEnabled:mode!=='off'}};},
    renderStats:s=>{context.stats=s;calls.push('stats');},
    index:async()=>{calls.push('index');if(mode==='index-failure')throw Error('503');return {rows:[]};},
    renderIndex:()=>calls.push('render-index'),
    indexUnavailable:disabled=>calls.push(disabled?'disabled':'index-unavailable'),
    empty(){},setTimeout:()=>calls.push('scheduled')};
  vm.createContext(context);
  await vm.runInContext(refresh+';refresh()',context);
  assert.equal(labels.connection,mode==='node-failure'?'Node unavailable':'● Node online');
  assert.ok(calls.includes('scheduled'));
  if(mode==='off'){assert.ok(calls.includes('stats'));assert.ok(calls.includes('disabled'));assert.ok(!calls.includes('index'));}
  if(mode==='index-failure'){assert.ok(calls.includes('stats'));assert.ok(calls.includes('index-unavailable'));}
  if(mode==='on')assert.ok(calls.includes('render-index'));
}
console.log('Dashboard refresh: SQLite OFF, index failure, SQLite ON, node failure passed');
