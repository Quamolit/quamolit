import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdirSync, copyFileSync} from 'node:fs';

assert.equal(process.platform, 'linux');
assert.equal(process.env.GITHUB_ACTIONS, 'true');
const run = (exe, args) => execFileSync(exe, args, {encoding:'utf8', maxBuffer:96e6, stdio:['pipe','pipe','pipe']});
assert.equal(run('calcit', ['-v']).trim(), '0.30.1');
const p = JSON.parse(readFileSync('reviewed-source.json'));
assert.equal(p.id, 'quamolit.math/bound-01');
assert.equal(p.operations.length, 1);
const blob = () => run('git', ['hash-object', 'calcit.cirru']).trim();
assert.equal(blob(), p.blob);
mkdirSync('inspection', {recursive:true});
const norm = v => Array.isArray(v) ? v.map(norm) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k,x]) => [k,k === '__edn_set' ? x.map(norm).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))) : norm(x)])) : v;
const q = (...args) => {const r=JSON.parse(run('calcit',['query',...args,'--format','json'])); assert.deepEqual(r.diagnostics||[],[]); return norm(r.data);};
const capture = (label, exe, args, input) => {
  const r=spawnSync(exe,args,{encoding:'utf8',input,maxBuffer:96e6});
  writeFileSync('inspection/'+label+'.stdout',r.stdout||'');
  writeFileSync('inspection/'+label+'.stderr',r.stderr||'');
  writeFileSync('inspection/'+label+'.json',JSON.stringify({status:r.status,args,exe}));
  assert.equal(r.signal,null); assert.equal(r.error,undefined); return r;
};
const calc = (label,args,input) => capture(label,'calcit',args,input);
const ordinary = () => {for(const [f,h] of Object.entries(p.ordinaryBlobs)) assert.equal(run('git',['hash-object',f]).trim(),h,f);};
const views = label => {
  const config=q('config'), namespaces=q('ns').namespaces.map(ns=>q('ns',ns)), defs=[];
  for(const ns of namespaces) {
    const names=run('calcit',['query','defs',ns.namespace]).split('\n').filter(x=>/^  \S/.test(x)).map(x=>x.trim().split(' ')[0]);
    assert.equal(names.length,ns.definition_count);
    for(const name of names) defs.push(q('def',ns.namespace+'/'+name));
    console.log(JSON.stringify({phase:label,verified:defs.length,total:1711}));
  }
  const value={config,namespaces,defs}; writeFileSync('inspection/'+label+'.json',JSON.stringify(value)); return value;
};
// Only one known diagnostic's unordered three-field schema pretty-print is canonicalized.
// Raw envelopes are retained; all codes, paths, origins and other fields compare exactly.
const parts=["(:args ([] 'T))",'(:kind :fn)',"(:return 'Bool)"], canonical='({} '+parts.join(' ')+')';
const orders=parts.flatMap((a,i)=>parts.filter((_,j)=>j!==i).map(b=>'({} '+[a,b,parts.find(c=>c!==a&&c!==b)].join(' ')+')'));
const diagnostic = d => {
  const v=structuredClone(d);
  for(const e of v.diagnostics) if(v.definition==='quamolit.controller.resolve/locate-target'&&e.code==='W_FN_ARG_TYPE_MISMATCH'&&e.actual==="'calcit.core/Option<dynamic>"&&e.expected==="list<'T>"&&JSON.stringify(e.path)==='[3,3,2,3,1,0,1]')
    for(const order of orders) e.message=e.message.replaceAll(order,canonical);
  return v;
};
const checkRecords = (old,next,allowPass) => {
  const previous=new Map(old.definitions.map(d=>[d.definition,d])); assert.equal(next.definitions.length,previous.size);
  const improved=[];
  for(const d of next.definitions) {
    const before=previous.get(d.definition); assert.ok(before,d.definition);
    if(allowPass&&before.status!=='passed'&&d.status==='passed') {
      assert.deepEqual(d.diagnostics,[]); assert.deepEqual(d.blocked_by,[]); improved.push(d.definition);
    } else assert.deepEqual(diagnostic(d),diagnostic(before),d.definition+' full diagnostics');
  }
  return improved;
};
const native = label => {
  const r=calc(label,['test','--require-match','--summary-only','--format','json']); assert.equal(r.status,0);
  const t=JSON.parse(r.stdout); for(const k of ['selected','executed','passed']) assert.equal(t[k],161); assert.equal(t.failed,0);
};
const scripts=['check:api-inventory','compile:bootstrap','test:runtime','compile','release'];
const gates = phase => {for(const script of scripts) {
  console.log('Running '+phase+' '+script); const r=capture(phase+'-'+script.replaceAll(':','-'),'yarn',[script]); assert.equal(r.status,0,phase+' '+script);
}};

run('calcit',['docs','agents','--contract']);
assert.deepEqual(views('actual-before'),norm(p.before)); ordinary();
const baseline=calc('before-all-definitions',['--check-only','--all-defs','--format','json']);
const oldCheck=JSON.parse(baseline.stdout).data;
checkRecords(p.baseline.data,oldCheck,false);
const strictBefore=calc('before-strict',['fix','--workflow','strict','--verify','--format','json']);
assert.notEqual(strictBefore.status,0,'Existing complete legacy strict must remain disclosed');
native('before-native'); gates('before'); ordinary(); assert.equal(blob(),p.blob);
writeFileSync('inspection/operations.json',JSON.stringify(p.operations));
const preview=calc('transaction-preview',['edit','transaction','--file','inspection/operations.json','--dry-run','--format','json']);
assert.equal(preview.status,0); const transaction=JSON.parse(preview.stdout);
assert.equal(transaction.dry_run,true); assert.ok(transaction.scoped_revision); assert.equal(blob(),p.blob);
assert.equal(calc('transaction-applied',['edit','transaction','--file','inspection/operations.json','--expect-revision',transaction.scoped_revision,'--format','json']).status,0);
assert.deepEqual(views('actual-after'),norm(p.expected));
const afterBlob=blob(); ordinary();
const checked=calc('after-all-definitions',['--check-only','--all-defs','--format','json']);
const newCheck=JSON.parse(checked.stdout).data;
const improved=checkRecords(oldCheck,newCheck,true);
assert.ok(improved.includes(p.id),'Target must genuinely pass with empty diagnostics and blocking origins');
assert.equal(checked.status,baseline.status);
const strictAfter=calc('after-strict',['fix','--workflow','strict','--verify','--format','json']);
assert.equal(strictAfter.status,strictBefore.status); assert.equal(strictAfter.stdout,strictBefore.stdout); assert.equal(strictAfter.stderr,strictBefore.stderr);
native('after-native'); gates('after');

// Actual native evaluation of the repaired function, not a JS reimplementation.
for(const [input,expected] of [['-1','0'],['0','0'],['0.25','0.25'],['1','1'],['2','1'],['nil','1']]) {
  const code='let\n    result $ quamolit.math/bound-01 '+input+'\n  assert= true $ if (number? result) (= result '+expected+') false\n';
  const r=calc('native-clamp-'+input.replaceAll('.','_'),['eval','--dep','./calcit.cirru','--stdin'],code); assert.equal(r.status,0,input);
}

// Force the actual public function into JS on a temporary opaque clone only.
// This fixture and its temporary CLI overrides are never exported to final source.
const clone='bound-regression.cirru', fixture='quamolit.math/__bound-regression!';
copyFileSync('calcit.cirru',clone);
const ops=[
  ['edit','def',fixture,'--input-format','json-ast','--code',JSON.stringify(['defn','__bound-regression!',[],['bound-01','nil'],'&unit'])],
  ['edit','schema',fixture,'--input-format','json-ast','--code',JSON.stringify(['{}',[':kind',':fn'],[':args',['[]']],[':return',"'Unit"]])]
];
writeFileSync('inspection/js-fixture-operations.json',JSON.stringify(ops));
const dry=calc('js-fixture-preview',[clone,'edit','transaction','--file','inspection/js-fixture-operations.json','--dry-run','--format','json']);
assert.equal(dry.status,0); const fixtureRevision=JSON.parse(dry.stdout); assert.equal(fixtureRevision.dry_run,true); assert.ok(fixtureRevision.scoped_revision);
assert.equal(calc('js-fixture-applied',[clone,'edit','transaction','--file','inspection/js-fixture-operations.json','--expect-revision',fixtureRevision.scoped_revision,'--format','json']).status,0);
assert.equal(calc('js-fixture-codegen',[clone,'--init-fn',fixture,'--reload-fn',fixture,'--emit-path','target/js/clamp-regression','js']).status,0);
const js=`import assert from 'node:assert/strict';
const m=await import('../target/js/clamp-regression/quamolit.math.mjs');
const bound=m.bound_01; assert.equal(typeof bound,'function');
for(const [input,expected] of [[-1,0],[0,0],[-0,-0],[0.25,0.25],[1,1],[2,1],[null,1],[Infinity,1],[-Infinity,0],[NaN,NaN]]) assert.ok(Object.is(bound(input),expected),String(input));
const warn=console.warn, seen=[]; console.warn=(...args)=>{seen.push(args);return undefined;};
try {for(const input of [false,'invalid']) {const n=seen.length; assert.equal(bound(input),undefined); assert.equal(seen.length,n+1);assert.deepEqual(seen[n],['invalid value to bound:',input]);}} finally {console.warn=warn;}
console.log('Actual emitted bound-01: numeric/nil/NaN/infinity/-0 and exact invalid-input warning/return passed');
`;
writeFileSync('inspection/clamp-runtime.mjs',js);
assert.equal(capture('actual-js-regression','node',['inspection/clamp-runtime.mjs']).status,0);
ordinary(); assert.equal(blob(),afterBlob);
assert.deepEqual(q('def',p.id),norm(p.expected.defs.find(d=>d.id===p.id)));
writeFileSync('inspection/summary.json',JSON.stringify({repo:p.repo,base:p.head,beforeBlob:p.blob,afterBlob,definitions:1711,namespaces:95,attachedTests:161,operations:1,changedDefinitions:1,ordinaryFilesPreserved:429,improved,beforeSummary:oldCheck.summary,afterSummary:newCheck.summary,strictOutputUnchanged:true,originalScriptsBeforeAndAfter:scripts,nativeNumericNilCases:6,actualEmittedJsVerified:true,limits:'Source-equivalence plus actual repaired-function runtime evidence; pre-repair bound-01 cannot compile under strict, so no claim of executing it before repair. Remaining complete legacy errors are actual failures. Not full Benchmark/Upload/Visual, browser or GPU acceptance. Temporary fixture is not exported.'}));
mkdirSync('prepared-source',{recursive:true}); copyFileSync('calcit.cirru','prepared-source/calcit.cirru');
