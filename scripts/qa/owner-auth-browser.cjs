// Reuse the existing local browser harness without modifying backend code or QA scripts.
const fs=require('fs'),path=require('path'),Module=require('module');
const backend=path.resolve(__dirname,'../../../Eema-backend');
let source=fs.readFileSync(path.join(backend,'scripts/qa/auth-browser.cjs'),'utf8');
source=source.replace("const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/qa/evidence/auth')", "const root="+JSON.stringify(backend)+",out=path.join(root,'docs/qa/evidence/auth/owner-recovery')");
const begin=source.indexOf(' // Real application client refresh');
const end=source.indexOf(' const backendLogs=',begin);
if(begin<0||end<0)throw Error('Browser harness layout changed');
let group=source.slice(begin,end);
group=group.replace("await signedIn(a);\n assert.equal", "await signedIn(a);await a.wait(\"document.body.textContent.includes('No venues yet')\",'owner list recovers without reload');\n assert.equal");
group=group.replace("await a.screen('cross-tab-session-preserved');", "await a.wait(\"document.body.textContent.includes('No venues yet')\",'winner owner list recovered');await b.client.wait(\"document.body.textContent.includes('No venues yet')\",'loser owner list recovered');assert.ok(!(await a.evaluate('document.body.textContent')).includes('ADMIN access'));assert.ok(!(await b.client.evaluate('document.body.textContent')).includes('ADMIN access'));await a.screen('owner-recovered-'+ownerRecoveryPass);");
group=group.replace('initialVenueReadMayReturn403:true','ownerListRecoveredWithoutReload:true');
source=source.slice(0,begin)+' for(let ownerRecoveryPass=1;ownerRecoveryPass<=3;ownerRecoveryPass++){\n'+group+'\n }\n'+source.slice(end);

source=source.replace(' const backendLogs=', `
 await a.go('/admin/bookings');await a.wait("document.body.textContent.includes('ADMIN access required')",'OWNER blocked by admin guard');record('OWNER cannot open ADMIN route');
 const scoutSession=await api('/auth/login',{email:accounts.SCOUT.user.email,password:newPassword},200);
 await a.evaluate('localStorage.setItem("eema:auth",'+JSON.stringify(JSON.stringify({...scoutSession,storedAt:Date.now()}))+')');
 await a.go('/owner/venues');await a.wait("document.body.textContent.includes('This area is not available for your account')",'SCOUT blocked by owner guard');record('SCOUT cannot open OWNER route');
 current=await api('/auth/login',{email:accounts.OWNER.user.email,password},200);
 await a.evaluate('localStorage.setItem("eema:auth",'+JSON.stringify(JSON.stringify({...current,storedAt:Date.now()}))+')');
 const publicVenues=await api('/venues',null,200);assert.ok(Array.isArray(publicVenues)&&publicVenues.length>0,'Local seed venue required');const foreignVenueId=publicVenues[0].id;
 await api('/venues/'+foreignVenueId+'/availability/settings',null,403,current.accessToken);
 await a.go('/owner/venues/'+foreignVenueId);await a.wait("document.body.textContent.includes('You do not have permission to manage this venue.')",'genuine owner ownership denial');assert.ok(!(await a.evaluate('document.body.textContent')).includes('ADMIN access'));await a.screen('owner-genuine-forbidden');record('Unchanged-session OWNER ownership403 remains forbidden',{backendStatus:403});
 const backendLogs=`);
source=source.replaceAll('docs/qa/evidence/auth/browser.json','docs/qa/evidence/auth/owner-recovery/browser.json');
const run=new Module(path.join(backend,'scripts/qa/owner-auth-browser.cjs'),module);run.filename=path.join(backend,'scripts/qa/owner-auth-browser.cjs');run.paths=module.paths;run._compile(source,run.filename);
