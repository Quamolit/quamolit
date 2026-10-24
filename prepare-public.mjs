import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const run=(...args)=>execFileSync('calcit',args,{encoding:'utf8',maxBuffer:64e6,stdio:['ignore','pipe','pipe']});
function normalize(v){
  if(Array.isArray(v))return v.map(normalize);
  if(v&&typeof v==='object'){
    const obj=Object.fromEntries(Object.entries(v).map(([k,x])=>[k,normalize(x)]));
    if(Object.keys(obj).length===1&&Array.isArray(obj.__edn_set))obj.__edn_set.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return obj;
  }return v;
}
const q=(...args)=>normalize(JSON.parse(run('query',...args,'--format','json')).data);
mkdirSync('acceptance',{recursive:true});
assert.equal(run('-v').trim(),'0.30.1');
writeFileSync('acceptance/agent-contract.txt',run('docs','agents','--contract'));
const blob=execFileSync('git',['hash-object','calcit.cirru'],{encoding:'utf8'}).trim();
writeFileSync('acceptance/config.json',JSON.stringify(q('config'),null,2));
const namespaces=q('ns').namespaces.map(ns=>q('ns',ns));
writeFileSync('acceptance/namespaces.json',JSON.stringify(namespaces,null,2));
const defs=[];
for(const info of namespaces){
  const names=run('query','defs',info.namespace).split('\n').filter(x=>/^  \S/.test(x)).map(x=>x.trim().split(' ')[0]);
  assert.equal(names.length,info.definition_count);
  for(const name of names)defs.push(q('def',`${info.namespace}/${name}`));
}
assert.equal(defs.length,1711);
writeFileSync('acceptance/before.json',JSON.stringify(defs,null,2));
let preview;
try{preview=run('fix','--include-attached','--format','json');}
catch(error){assert.equal(error.status,1);preview=error.stdout;}
JSON.parse(preview);writeFileSync('acceptance/official-fix-preview.json',preview);
assert.equal(execFileSync('git',['hash-object','calcit.cirru'],{encoding:'utf8'}).trim(),blob);
writeFileSync('acceptance/snapshot-before-blob.txt',blob+'\n');
console.log(JSON.stringify({definitions:defs.length,namespaces:namespaces.length,tests:defs.reduce((n,d)=>n+d.tests.length,0),examples:defs.reduce((n,d)=>n+d.examples.length,0),snapshotUnchanged:blob,mode:'readonly preview only, no apply/format/compile/deploy'}));
