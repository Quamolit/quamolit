import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
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
assert.equal(run('-v').trim(),'0.30.1');run('docs','agents','--contract');
assert.equal(execFileSync('git',['hash-object','calcit.cirru'],{encoding:'utf8'}).trim(),'dacf6efcc3a29b4c0d86e2dc366501f799743baa');
const before=JSON.parse(readFileSync('acceptance/reviewed.json','utf8'));
const config=JSON.parse(readFileSync('acceptance/reviewed-config.json','utf8'));
const namespaces=JSON.parse(readFileSync('acceptance/reviewed-namespaces.json','utf8'));
assert.deepEqual(q('config'),config);assert.deepEqual(q('ns').namespaces.map(ns=>q('ns',ns)),namespaces);
const evidence=JSON.parse(readFileSync('acceptance/reviewed-length-types.json','utf8'));
assert.equal(evidence.length,134);
const held=new Set(['quamolit.render.element/textbox','quamolit.render.paint/paint-path']);
const manual=new Set(['quamolit.component-sample/with-rect-color-motion','quamolit.examples.todolist/main!','quamolit.test.gpu-component-fixture/main!','quamolit.test.replay-archive-fixture/checkpoint-count','quamolit.test.replay-archive-fixture/input-count']);
let proven=0,reviewed=0,skipped=0,testHeads=0,testReplacements=0;
const expected=structuredClone(before),ops=[];
function walk(node,path,id,region){
  if(!Array.isArray(node))return;
  if(['quote','quasiquote',';','comment','defmacro'].includes(node[0]))return;
  if(node[0]==='count'){
    assert.equal(node.length,2);
    if(region==='code'){
      const proof=evidence.find(x=>x.definition===id&&x.path===path.join('.'));
      assert.ok(proof);assert.deepEqual(proof.operand,node[1]);
      if(held.has(id)){skipped++;return;}
      if(proof.len){
        assert.equal(proof.len.status,'proven');
        assert.ok(['calcit.core/&list:count','calcit.core/&str:count','calcit.core/&set:count'].includes(proof.len.definition));
        assert.deepEqual(proof.len.call_types,{parameters:[],rest:null,returns:"'Number"});
        assert.deepEqual(proof.diagnostics,[]);proven++;
      }else{assert.ok(manual.has(id));assert.equal(proof.inferredType,null);reviewed++;}
      const p='@'+[...path,0].join('.');
      assert.equal(JSON.parse(run('tree','show',id,'--path',p,'--format','json')).tree,'count');
      ops.push(['tree','replace',id,'--path',p,'--input-format','json-ast','--code',JSON.stringify('.len'),'--expect','quote count']);
    }else testHeads++;
    node[0]='.len';
  }
  node.forEach((n,i)=>walk(n,[...path,i],id,region));
}
for(const d of expected){
  walk(d.code,[],d.id,'code');
  for(const t of d.tests){
    const old=JSON.stringify(t.code);walk(t.code,[],d.id,'test');
    if(old!==JSON.stringify(t.code)){
      const op=['edit','add-test',d.id,t.name,'--overwrite','--input-format','json-ast','--code',JSON.stringify(t.code)];
      if(t.tags.length)op.push('--tags',t.tags.join(','));ops.push(op);testReplacements++;
    }
  }
}
assert.equal(before.length,1711);assert.equal(proven,126);assert.equal(reviewed,5);assert.equal(skipped,3);assert.equal(testHeads,52);assert.equal(testReplacements,27);
assert.equal(ops.length,158);
writeFileSync('acceptance/operations.json',JSON.stringify(ops,null,2));
const args=['edit','transaction','--file','acceptance/operations.json','--format','json'];
const preview=JSON.parse(run(...args,'--dry-run'));assert.ok(preview.scoped_revision);
writeFileSync('acceptance/transaction-preview.json',JSON.stringify(preview,null,2));
writeFileSync('acceptance/transaction-applied.json',run(...args,'--expect-revision',preview.scoped_revision));
const actual=[];
for(const ns of namespaces){
  const names=run('query','defs',ns.namespace).split('\n').filter(x=>/^  \S/.test(x)).map(x=>x.trim().split(' ')[0]);
  assert.equal(names.length,ns.definition_count);
  for(const name of names)actual.push(q('def',`${ns.namespace}/${name}`));
  console.log(JSON.stringify({verifiedDefinitions:actual.length,total:1711,namespace:ns.namespace}));
}
assert.deepEqual(actual,expected);
assert.deepEqual(q('config'),config);assert.deepEqual(q('ns').namespaces.map(ns=>q('ns',ns)),namespaces);
writeFileSync('acceptance/after.json',JSON.stringify(actual,null,2));
writeFileSync('acceptance/summary.json',JSON.stringify({definitions:actual.length,proven,reviewed,skipped,testHeads,testReplacements,operations:ops.length,preserved:'all metadata/schemas/ns/config/FFI/HUD/operands/expected values/test names/tags'},null,2));
writeFileSync('acceptance/snapshot-after-blob.txt',execFileSync('git',['hash-object','calcit.cirru'],{encoding:'utf8'}));
