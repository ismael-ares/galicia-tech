// Exercises only this new local Compose project; never touches other deployments.
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
const docker=process.env.DOCKER_BIN||'docker';const root=path.resolve(__dirname,'..');const out=path.join(root,'output','v1');fs.mkdirSync(out,{recursive:true});
function compose(args,options={}){return execFileSync(docker,['compose',...args],{cwd:root,stdio:['pipe','pipe','pipe'],...options});}
function manage(code){return compose(['exec','-T','backend','python','manage.py','shell','-c',code],{encoding:'utf8'}).trim().split('\n').at(-1);}
(async()=>{
 let workerStopped=false,redisStopped=false,restoreDatabase=null;
 try{
  const before=JSON.parse(manage("import json; from core.models import Event,Source; print(json.dumps({'events':Event.objects.count(),'sources':Source.objects.count()}))"));
  compose(['stop','worker']);workerStopped=true;
  manage("from django_q.tasks import async_task; async_task('operator.add',20,22,task_name='v1-durability-probe')");
  compose(['up','-d','--wait','--wait-timeout','90','worker']);workerStopped=false;
  let result;
  for(let attempt=0;attempt<20;attempt++){
   result=manage("from django_q.models import Success; t=Success.objects.filter(name='v1-durability-probe').order_by('-started').first(); print(t.result if t else 'pending')");
   if(result==='42')break;await new Promise(r=>setTimeout(r,500));
  }
  assert.equal(result,'42','Queued task did not survive the worker restart');
  const dump=compose(['exec','-T','db','pg_dump','-U','galiciatech','-d','galiciatech','--format=custom']);fs.writeFileSync(path.join(out,'restore-probe.dump'),dump);
  restoreDatabase='restore_probe_'+Date.now();
  compose(['exec','-T','db','createdb','-U','galiciatech',restoreDatabase]);
  compose(['exec','-T','db','pg_restore','-U','galiciatech','--dbname',restoreDatabase,'--no-owner'],{input:dump});
  const restored=compose(['exec','-T','db','psql','-U','galiciatech','-d',restoreDatabase,'-tAc','SELECT count(*) FROM core_event'],{encoding:'utf8'}).trim();assert.equal(Number(restored),before.events);
  compose(['exec','-T','db','dropdb','-U','galiciatech',restoreDatabase]);restoreDatabase=null;
  compose(['up','-d','--force-recreate','--wait','--wait-timeout','90','db']);
  const after=JSON.parse(manage("import json; from core.models import Event,Source; print(json.dumps({'events':Event.objects.count(),'sources':Source.objects.count()}))"));assert.deepEqual(after,before);
  compose(['stop','redis']);redisStopped=true;
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
   const context=await browser.newContext();const request=context.request;
   const session=await (await request.get('http://127.0.0.1:8088/api/v1/session/')).json();
   const login=await request.post('http://127.0.0.1:8088/_allauth/browser/v1/auth/login',{headers:{'X-CSRFToken':session.csrfToken},data:{email:'nonexistent@example.org',password:'no-credentials'}});
   assert.equal(login.status(),503,'Authentication must fail closed when Redis is down');
   assert.equal((await request.get('http://127.0.0.1:8088/api/v1/catalog/')).status(),200,'Published catalogue must stay readable');
  }finally{await browser.close();}
  compose(['up','-d','--wait','--wait-timeout','90','redis']);redisStopped=false;
  compose(['up','-d','--wait','--wait-timeout','120']);
  fs.writeFileSync(path.join(out,'operation-checks.json'),JSON.stringify({status:'passed',workerQueueSurvivedRestart:true,backupRestoredToSeparateDatabase:true,postgresContainerRecreatedWithoutDataLoss:true,redisOutageBlocksAuth:true,publicCatalogueDuringRedisOutage:true,counts:after},null,2));
  console.log('PASS operations: durable Q2 job, backup/restore, PostgreSQL volume persistence, Redis fail-closed and public availability.');
 }finally{
  if(workerStopped)compose(['up','-d','worker']);if(redisStopped)compose(['up','-d','redis']);
  if(restoreDatabase)compose(['exec','-T','db','dropdb','-U','galiciatech',restoreDatabase]);
 }
})().catch(e=>{console.error(e.message);if(e.stderr)console.error(e.stderr.toString());process.exitCode=1});
