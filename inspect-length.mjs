import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const run=(...args)=>execFileSync('calcit',args,{encoding:'utf8',maxBuffer:64e6,stdio:['ignore','pipe','pipe']});
assert.equal(run('-v').trim(),'0.30.1');
writeFileSync('acceptance/agent-contract-current.txt',run('docs','agents','--contract'));
const blob=execFileSync('git',['hash-object','calcit.cirru'],{encoding:'utf8'}).trim();
assert.equal(blob,'dacf6efcc3a29b4c0d86e2dc366501f799743baa');
const defs=JSON.parse(readFileSync('acceptance/reviewed.json','utf8'));
assert.equal(defs.length,1711);
const command=['fix','--include-attached','--format','json'];
const preview=spawnSync('calcit',command,{encoding:'utf8',maxBuffer:64e6});
assert.ifError(preview.error);
writeFileSync('acceptance/official-fix-result.json',JSON.stringify({command,status:preview.status,signal:preview.signal,stdout:preview.stdout,stderr:preview.stderr},null,2));
const matches=[];
function walk(node,path,id,region,testName){
  if(!Array.isArray(node))return;
  if(['quote','quasiquote',';','comment','defmacro'].includes(node[0]))return;
  if(node[0]==='count'){
    assert.equal(node.length,2);
    matches.push({definition:id,region,testName,path:path.join('.'),operand:node[1]});
  }
  node.forEach((n,i)=>walk(n,[...path,i],id,region,testName));
}
for(const d of defs){walk(d.code,[],d.id,'code');for(const t of d.tests)walk(t.code,[],d.id,'test',t.name);}
assert.equal(matches.filter(x=>x.region==='code').length,134);
assert.equal(matches.filter(x=>x.region==='test').length,52);
const evidence=[];
for(const m of matches.filter(x=>x.region==='code')){
  const result=spawnSync('calcit',['query','type-at',m.definition,'--path','@'+m.path+'.1','--format','json'],{encoding:'utf8',maxBuffer:8e6});
  assert.ifError(result.error);
  let parsed=null;if(result.stdout.trim())try{parsed=JSON.parse(result.stdout);}catch{}
  evidence.push({...m,status:result.status,result:parsed,stdout:parsed?null:result.stdout,stderr:result.stderr});
  if(evidence.length%20===0)console.log(JSON.stringify({typeQueries:evidence.length,total:134}));
}
writeFileSync('acceptance/count-sites.json',JSON.stringify(matches,null,2));
writeFileSync('acceptance/receiver-types.json',JSON.stringify(evidence,null,2));
assert.equal(execFileSync('git',['hash-object','calcit.cirru'],{encoding:'utf8'}).trim(),blob);
console.log(JSON.stringify({readonly:true,blob,definitions:defs.length,sites:matches.length,receiverQueries:evidence.length,officialFixExit:preview.status}));
