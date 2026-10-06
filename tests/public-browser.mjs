import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const dir=mkdtempSync(join(tmpdir(),'public-browser-')),mode=join(dir,'mode');writeFileSync(mode,'ok');
const base='http://127.0.0.1:3120';
const server=spawn(process.execPath,['--import',resolve('tests/fixtures/github-preload.mjs'),'node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3120'],{env:{...process.env,NODE_ENV:'production',OS_USERNAME:'fixture',OS_PASSWORD:'fixture-password',OS_SESSION_SECRET:'fixture-secret',OS_HOST:'127.0.0.1',OS_ALLOW_BASIC_AUTH:'false',GITHUB_OBSIDIAN_TOKEN:'fixture-token',OBSIDIAN_REPO:'lattelix/obsidian',OS_TEST_MODE_FILE:mode,GOOGLE_CALENDAR_CLIENT_ID:'',GOOGLE_CALENDAR_CLIENT_SECRET:'',GOOGLE_CALENDAR_REFRESH_TOKEN:''},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',b=>logs+=b);server.stderr.on('data',b=>logs+=b);
let browser,combinations=0,interactions=0;const ok=(v,msg)=>{assert.ok(v,msg);interactions++};
try{
 for(let i=0;i<60;i++){try{await fetch(base+'/about');break}catch{await new Promise(r=>setTimeout(r,250))}}
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [320,390,768,1440])for(const colorScheme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width,height:1000},colorScheme});const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const path of ['/','/about','/privacy','/terms','/login']){
   await p.goto(base+path,{waitUntil:'networkidle'});
   const info=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,dark:document.documentElement.classList.contains('dark')}));
   assert.ok(info.scroll<=info.width+1,`overflow ${width} ${path}: ${info.scroll}`);assert.equal(info.dark,colorScheme==='dark');
   assert.ok(await p.getByRole('link',{name:'Конфиденциальность',exact:true}).count());combinations++;
  }
  assert.equal(errors.length,0,errors.join('\n'));await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:900},colorScheme:'dark'});const p=await ctx.newPage();
 await p.goto(base+'/os/protocols');ok(p.url().includes('/login?returnTo='),'protected redirect');
 await p.getByLabel('Логин',{exact:true}).fill('fixture');await p.getByLabel('Пароль',{exact:true}).fill('wrong');await p.getByRole('button',{name:'Войти в Personal OS'}).click();await p.locator('.site-form-error').waitFor();{const err=await p.locator('.site-form-error').innerText();ok(err.includes('Неверный'),'generic error');}
 await p.getByLabel('Пароль',{exact:true}).fill('fixture-password');await p.getByRole('button',{name:'Показать пароль'}).click();ok(await p.locator('#password').getAttribute('type')==='text','password reveal');await p.getByRole('button',{name:'Скрыть пароль'}).click();
 await Promise.all([p.waitForURL('**/os/protocols'),p.getByRole('button',{name:'Войти в Personal OS'}).click()]);await p.getByText('Fixture protocol',{exact:true}).first().waitFor();ok(true,'return to requested page');
 const cookies=await ctx.cookies();const sess=cookies.find(c=>c.name==='__Host-lifedeck-session');ok(sess?.httpOnly&&sess?.secure,'real browser secure cookie');ok(!(await p.evaluate(()=>document.cookie)).includes('lifedeck-session'),'not exposed to JS');
 const logout=p.getByRole('button',{name:'Выйти',exact:true});ok(await logout.isVisible(),'logout visible on mobile');const box=await logout.boundingBox();ok(box.x>=0&&box.x+box.width<=390,'logout within viewport');
 const other=await ctx.newPage();await other.goto(base+'/os');await p.bringToFront();await Promise.all([p.waitForURL('**/login?loggedOut=1'),logout.click()]);ok(!(await ctx.cookies()).some(c=>c.name==='__Host-lifedeck-session'),'logout removes cookie');await other.bringToFront();await other.waitForURL('**/login');ok(true,'other tab rechecks session');
 await p.goto(base+'/os/review');ok(p.url().includes('/login'),'revisit after logout blocked');
 if(process.env.PUBLIC_SCREENSHOTS){mkdirSync(process.env.PUBLIC_SCREENSHOTS,{recursive:true});await p.setViewportSize({width:1440,height:1000});await p.goto(base+'/about');await p.screenshot({path:join(process.env.PUBLIC_SCREENSHOTS,'landing.png'),fullPage:true});await p.goto(base+'/login');await p.screenshot({path:join(process.env.PUBLIC_SCREENSHOTS,'login.png'),fullPage:true});}
 await ctx.close();console.log(`PASS ${combinations} public route/theme/viewport combinations + ${interactions} browser auth checks`);
} catch(e){console.error(logs.slice(-1000));throw e}finally{await browser?.close();server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));rmSync(dir,{recursive:true,force:true})}
