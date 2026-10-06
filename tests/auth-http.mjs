import http from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'auth-http-')),mode=join(dir,'mode');writeFileSync(mode,'ok');
const port=3119,base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['--import',resolve('tests/fixtures/github-preload.mjs'),'node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env:{...process.env,NODE_ENV:'production',OS_USERNAME:'fixture',OS_PASSWORD:'fixture-password',OS_SESSION_SECRET:'test-key-only',OS_ALLOW_BASIC_AUTH:'false',OS_HOST:'os.test',GITHUB_OBSIDIAN_TOKEN:'fixture-token',OBSIDIAN_REPO:'lattelix/obsidian',OS_TEST_MODE_FILE:mode,GOOGLE_CALENDAR_CLIENT_ID:'',GOOGLE_CALENDAR_CLIENT_SECRET:'',GOOGLE_CALENDAR_REFRESH_TOKEN:''},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);let count=0;
const req=(path,init={})=>fetch(base+path,{redirect:'manual',...init});
const check=(v,msg)=>{assert.ok(v,msg);count++};
try{
 for(let i=0;i<80;i++){try{await req('/about');break}catch{await new Promise(r=>setTimeout(r,200))}}
 for(const path of ['/about','/privacy','/terms','/login']){const r=await req(path),t=await r.text();check(r.status===200,path);check(!t.includes('Fixture Daily'),path+' private data');check(!r.headers.has('www-authenticate'),path+' no browser prompt')}
 const hostPage = h => new Promise((resolve,reject) => { http.get(base,{headers:{Host:h}},res => {let text='';res.on('data',b=>text+=b);res.on('end',()=>resolve(text));}).on('error',reject); });
 check((await hostPage('os.test')).includes('Меньше решений.'),'OS host landing');
 let r;
 check((await hostPage('me.test')).includes('Живой профиль'),'public profile preserved');
 for(const path of ['/os','/os/protocols','/os/review','/os/knowledge','/os/integrations','/os/calendar','/os/capture']){
  r=await req(path);check(r.status===307,path+' redirect');check(r.headers.get('location')?.includes('/login?returnTo='),path+' destination');check(r.headers.get('cache-control')?.includes('no-store'),path+' cache');
  r=await req(path,{headers:{RSC:'1','x-middleware-subrequest':'middleware:middleware:middleware'}});check(!((await r.text()).includes('Fixture')),'no RSC leak '+path);
 }
 for(const path of ['/api/os/capture','/api/os/daily','/api/os/daily/state','/api/os/note','/api/os/calendar/events']){r=await req(path,{method:path.endsWith('state')||path.endsWith('note')?'PUT':'POST',headers:{origin:base,'content-type':'application/json'},body:'{}'});check(r.status===401,'API denied '+path)}
 const c=await req('/api/auth/csrf'),csrf=(await c.json()).token,csrfCookie=c.headers.getSetCookie()[0].split(';')[0];
 const login=async(password,extra={},headers={})=>req('/api/auth/login',{method:'POST',headers:{origin:base,cookie:csrfCookie,'content-type':'application/json','x-csrf-token':csrf,...headers},body:JSON.stringify({username:'fixture',password,...extra})});
 r=await login('wrong');check(r.status===401,'wrong password');check(!(await r.text()).includes('fixture-password'),'no password echo');
 r=await login('fixture-password',{}, {origin:'https://evil.example'});check(r.status===403,'cross origin');
 r=await login('fixture-password',{}, {'x-csrf-token':'bad'});check(r.status===403,'csrf');
 r=await login('fixture-password',{returnTo:'https://evil.example'});check(r.status===200,'login');check((await r.json()).returnTo==='/os','safe redirect');
 const cookies=r.headers.getSetCookie();const session=cookies.find(s=>s.startsWith('__Host-lifedeck-session='));check(session.includes('HttpOnly')&&session.includes('Secure')&&session.includes('SameSite=lax'),'cookie protections');check(session.includes('Max-Age=43200'),'session lifetime');const cookie=session.split(';')[0];
 for(const path of ['/os','/os/protocols','/os/review','/os/knowledge','/os/integrations']){r=await req(path,{headers:{cookie}});check(r.status===200,'cookie route '+path);check((await r.text()).includes('Fixture')||path.endsWith('integrations'),'private data after auth '+path)}
 r=await req('/login?returnTo=/os/review',{headers:{cookie}});check(r.status===307&&r.headers.get('location').endsWith('/os/review'),'logged in return path');
 r=await req('/api/os/capture',{method:'POST',headers:{cookie,origin:'https://evil.example','content-type':'application/json'},body:'{"text":"test"}'});check(r.status===403,'private mutation csrf origin');
 r=await req('/api/os/capture',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json'},body:'{"text":"test"}'});check(r.status===200,'cookie capture fixture');
 r=await req('/api/auth/logout',{method:'POST',headers:{cookie,origin:base}});check(r.status===403,'logout csrf');
 const challenge=await req('/api/auth/csrf',{headers:{cookie}}),token=(await challenge.json()).token;
 r=await req('/api/auth/logout',{method:'POST',headers:{origin:base,'x-csrf-token':token,cookie:cookie+'; '+challenge.headers.getSetCookie()[0].split(';')[0]}});check(r.status===200,'logout');check(r.headers.getSetCookie().some(c=>c.startsWith('__Host-lifedeck-session=;')&&c.includes('Max-Age=0')),'session cleared');
 r=await req('/api/auth/session');check(r.status===401,'session absent');r=await req('/os');check(r.status===307,'private closed after cookie removal');
 // Server has no persistent revocation DB: docs explicitly describe copied-cookie replay until expiry.
 for(let i=0;i<12;i++)r=await login('wrong');check(r.status===429,'login rate cap');
 console.log(`PASS ${count} auth/public production HTTP checks (fixtures only)`);
}catch(e){console.error(logs.slice(-2000));throw e}finally{server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));rmSync(dir,{recursive:true,force:true})}
