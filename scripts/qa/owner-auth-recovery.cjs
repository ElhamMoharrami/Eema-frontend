// Actual frontend modules, controlled transport, no browser framework or timing sleeps.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto').webcrypto;
const root=path.resolve(__dirname,'../..'),ts=require(path.join(root,'node_modules/typescript'));
const sample=()=>({accessToken:'fixture-access',refreshToken:'fixture-refresh',tokenType:'Bearer',expiresIn:900,user:{id:'fixture-owner',email:'qa@example.test',fullName:'QA Owner',role:'OWNER',active:true,emailVerified:true}});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const response=(status)=>new Response(JSON.stringify({message:'Forbidden',ok:true}),{status});
function harness(fetch){const shared=new Map();const context=vm.createContext({crypto,window:{localStorage:{getItem:k=>shared.get(k)||null,setItem:(k,v)=>shared.set(k,v),removeItem:k=>shared.delete(k)},dispatchEvent:()=>{}},fetch,Headers,Response,FormData,Event});const cache={};
 function load(name){if(name==="./client")name="@/lib/api/client";if(cache[name])return cache[name];if(name==='@/lib/config')return {API_BASE_URL:'http://qa/api'};const source=fs.readFileSync(path.join(root,name.replace('@/','')+'.ts'),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const exports={};cache[name]=exports;vm.runInContext('(function(require,exports){'+js+'\n})',context)(load,exports);return exports;}
 const token=load('@/lib/auth/token'),client=load('@/lib/api/client'),mapper=load('@/lib/api/error-message');token.saveAuthSession(sample());return {token,client,mapper};}
(async()=>{const checks=[];
 for(const timing of ['during-refresh','after-refresh']){
  const began=deferred(),release=deferred(),stale=deferred();let a=0,b=0,refresh=0;
  const h=harness(async url=>{if(url.endsWith('/auth/refresh')){refresh++;began.resolve();await release.promise;return new Response(JSON.stringify({...sample(),refreshToken:'rotated'}));}if(url.endsWith('/policies/status'))return response(++a===1?401:200);b++;if(b===1){await stale.promise;return response(403);}return response(200);});
  const pa=h.client.apiRequest('/policies/status',{auth:'required'});const pb=h.client.apiRequest('/venues/my',{auth:'required'}).catch(e=>e.status);
  await began.promise;if(timing==='during-refresh')stale.resolve();release.resolve();await pa;if(timing==='after-refresh')stale.resolve();const result=await pb;
  assert.equal(result.ok,true,'stale 403 must recover');assert.equal(a,2);assert.equal(b,2);assert.equal(refresh,1);assert.equal(h.token.getAuthSession().user.role,'OWNER');checks.push({name:timing,result:'PASS',refreshCalls:refresh,ownerAttempts:b});
 }
 // Earliest ordering:403 arrives before any other request has begun refreshing.
 {const started=deferred(),release=deferred();let resources=0,me=0,refresh=0;
  const t=harness(async url=>{if(url.endsWith('/auth/refresh')){refresh++;started.resolve();await release.promise;return new Response(JSON.stringify({...sample(),refreshToken:'early-rotation'}));}if(url.endsWith('/auth/me'))return response(++me===1?401:200);return response(++resources<=2?403:200);});
  const a=t.client.apiRequest('/venues/my',{auth:'required'}),b=t.client.apiRequest('/owner/bookings',{auth:'required'});await started.promise;release.resolve();await Promise.all([a,b]);assert.equal(resources,4);assert.equal(me,2);assert.equal(refresh,1);checks.push({name:'403-before-refresh-coalesces-session-check',result:'PASS',resourceAttempts:resources,meAttempts:me,refreshCalls:refresh});
 }
 let deniedReads=0,validChecks=0;const h=harness(async url=>{if(url.endsWith('/auth/me')){validChecks++;return response(200);}deniedReads++;return response(403);});await assert.rejects(h.client.apiRequest('/venues/my',{auth:'required'}),e=>e.status===403);assert.doesNotMatch(h.mapper.apiErrorMessage(new h.client.ApiError(403,'Forbidden')),/ADMIN/);assert.equal(deniedReads,1);assert.equal(validChecks,1);checks.push({name:'real-owner-forbidden-and-copy',result:'PASS',resourceAttempts:deniedReads,validSessionChecks:validChecks});
 for(const kind of ['retry-forbidden','retry-unauthorized','write-forbidden','logout-pending-success','account-switch']){
  const started=deferred(),release=deferred();let calls=0,refresh=0;
  const t=harness(async url=>{if(url.endsWith('/auth/refresh')){refresh++;return response(401);}calls++;if(calls===1){started.resolve();await release.promise;return response(kind==='logout-pending-success'||kind==='account-switch'?200:403);}return response(kind==='retry-unauthorized'?401:403);});
  const pending=t.client.apiRequest('/venues/my',{auth:'required',method:kind==='write-forbidden'?'POST':'GET'}).catch(e=>e.status);
  await started.promise;if(kind==='logout-pending-success')t.token.clearAuthSession();else t.token.saveAuthSession({...sample(),user:{...sample().user,id:kind==='account-switch'?'other-owner':sample().user.id}});release.resolve();
  const status=await pending;assert.equal(status,['retry-unauthorized','logout-pending-success','account-switch'].includes(kind)?401:403);assert.equal(calls,kind.startsWith('retry-')?2:1);assert.equal(refresh,0);checks.push({name:kind,result:'PASS',attempts:calls,refreshCalls:refresh});
 }
 const c=harness(async()=>response(403));assert.match(c.mapper.apiErrorMessage(new c.client.ApiError(403,'Forbidden'),'OWNER'),/owner resource/);assert.match(c.mapper.apiErrorMessage(new c.client.ApiError(403,'Forbidden'),'ADMIN'),/ADMIN/);assert.match(c.mapper.apiErrorMessage(new c.client.ApiError(401,'Unauthorized'),'OWNER'),/session/);checks.push({name:'context-aware-401-403-copy',result:'PASS'});
 // Execute the real role/load-state branches with only their context/UI dependencies stubbed.
 function component(file,auth){const source=fs.readFileSync(path.join(root,file),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;const exports={};new Function('require','exports',js)(name=>name==='react/jsx-runtime'?require(path.join(root,'node_modules/react/jsx-runtime')):name==='./AuthProvider'?{useAuth:()=>auth}:{default:()=>null},exports);return exports.default;}
 const loadState=component('components/admin/AdminLoadState.tsx');assert.doesNotMatch(loadState({state:'forbidden',role:'OWNER'}).props.message,/ADMIN/);assert.match(loadState({state:'forbidden'}).props.title,/ADMIN/);
 for(const [actual,required,allowed] of [['SCOUT','OWNER',false],['OWNER','ADMIN',false],['ADMIN','ADMIN',true]]){const guard=component('components/auth/RoleGuard.tsx',{isAuthReady:true,user:{role:actual}});const result=guard({role:required,children:'allowed-child'});if(allowed)assert.equal(result.props.children,'allowed-child');else assert.match(result.props.message,new RegExp(required==='OWNER'?'owner':'ADMIN'));}
 checks.push({name:'actual-owner-admin-load-state-and-role-guards',result:'PASS'});
 console.log(JSON.stringify({result:'PASS',checks},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1});
