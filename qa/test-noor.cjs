const {chromium} = require(process.env.PW_MODULE||'playwright');
const fs=require('node:fs'), path=require('node:path');
const mode=process.argv[2]||'baseline', stop=process.argv[3]||'entry';
const mobile=stop==='mobile', space=mobile?'entry':stop;
const base=process.env.NOOR_URL||('http://127.0.0.1:8765/'+mode+'/');
const out=path.join(__dirname,'results',mode); fs.mkdirSync(out,{recursive:true});
const metrics={mode,stop,errors:[],warnings:[],pageErrors:[],requestsFailed:[],checks:{}};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-background-networking','--disable-renderer-backgrounding']});
  const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1040,height:680},deviceScaleFactor:1,hasTouch:mobile,isMobile:mobile});
  page.setDefaultTimeout(22000);
  page.on('console',m=>{if(m.type()==='error')metrics.errors.push(m.text().slice(0,1600));if(m.type()==='warning')metrics.warnings.push(m.text().slice(0,250));});
  page.on('pageerror',e=>metrics.pageErrors.push(String(e).slice(0,2000)));
  page.on('requestfailed',r=>metrics.requestsFailed.push(r.url().slice(0,300)+' '+r.failure()?.errorText));
  await page.route('**/*',route=>{const url=route.request().url();if(/^https?:/.test(url)&&new URL(url).origin!==new URL(base).origin)return route.fulfill({status:200,body:''});return route.continue();});
  await page.addInitScript(()=>{
    window.noorQA={};
    document.addEventListener('noor-first-view',()=>window.noorQA.firstFrameMs=Math.round(performance.now()),{once:true});
    const watch=name=>Object.defineProperty(window,name,{configurable:true,set(obj){const key=name==='LibraryWalk'?'mount':'install', f=obj[key];obj[key]=function(...args){const result=f.apply(this,args);if(name==='LibraryWalk'){window.noorQA.walker=result;window.noorQA.camera=args[0].camera;}else{window.noorQA.frame=result;window.noorQA.renderer=args[2];}return result;};Object.defineProperty(window,name,{configurable:true,writable:true,value:obj});}});
    if(window===top){watch('LibraryWalk');watch('LibraryFrameControl');}
  });
  const url=base+'?space='+space+'&diagnostics=1';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForFunction(()=>document.querySelector('#studio-loading')?.hidden||document.body.classList.contains('walking-fallback'),{},{timeout:120000});
  metrics.boot=await page.evaluate(()=>({readyMs:Math.round(performance.now()),firstFrameMs:noorQA.firstFrameMs,room:document.getElementById('room-name').textContent,fallback:document.body.classList.contains('walking-fallback'),stageHidden:document.querySelector('#gallery-study').hidden}));
  if(metrics.boot.fallback)throw Error('3D view fell back to map');
  await page.waitForFunction(()=>/16\s*\/\s*16/.test(document.querySelector('#frame-meter')?.textContent||''),{},{timeout:40000}).catch(()=>{});
  metrics.settled=await page.evaluate(()=>({at:Math.round(performance.now()),meter:document.querySelector('#frame-meter')?.textContent,state:window.noorQA.walker.getState(),cam:window.noorQA.camera.position.toArray(),rot:window.noorQA.camera.rotation.toArray(),render:window.noorQA.frame.getStats(),overflow:document.documentElement.scrollWidth>innerWidth}));
  await page.addStyleTag({content:'#frame-meter{display:none!important}'});
  await page.screenshot({path:path.join(out,stop+'.jpg'),type:'jpeg',quality:89,timeout:65000});
  if(space==='entry'&&!mobile){
    const before=await page.evaluate(()=>noorQA.walker.getState().position);
    const cam=page.locator('#view');
    await cam.focus();await page.keyboard.down('w');
    await page.waitForFunction(([x,y,z])=>Math.hypot(noorQA.walker.getState().position[0]-x,noorQA.walker.getState().position[2]-z)>.12,before,{timeout:10000});
    await page.keyboard.up('w');
    metrics.checks.walk=await page.evaluate(()=>noorQA.walker.getState().position);
    await page.getByRole('button',{name:'Guide',exact:true}).first().click();
    await page.locator('#sg-dialog[open] [data-guide-action="brief"]').click();
    await page.locator('#brief-form input[name=name]').fill('Noor QA roof');
    await page.locator('#brief-form select[name=kind]').selectOption('roof');
    await page.locator('#brief-form button[type=submit]').click();
    const f=page.frameLocator('#workbench');await f.locator('#active-name').waitFor({state:'visible'});
    metrics.checks.project=await f.locator('#project-label').innerText();
    metrics.checks.assembly=await f.locator('.assembly-tabs [aria-pressed=true], .assembly-tabs .active, .assembly-tabs [aria-selected=true], .assembly-tabs [class*=active]').first().innerText({timeout:3500}).catch(()=>null);
    const frame=page.frames().find(x=>x.parentFrame()===page.mainFrame());
    await f.locator('[data-unit=si]').click();
    metrics.checks.Ubefore=await f.locator('#impact .impact-number').getAttribute('data-u-value');
    await f.locator('#film-control').click();
    metrics.checks.Uafter=await f.locator('#impact .impact-number').getAttribute('data-u-value');
    if(!Number(metrics.checks.Ubefore)||!Number(metrics.checks.Uafter)||metrics.checks.Ubefore===metrics.checks.Uafter)throw Error('Changing surface films did not change the assembly U-value');
    metrics.checks.initialReadout=(await frame.locator('body').innerText()).split('\n').filter(x=>/W\/|thermal resistance|ft²|m²|Btu|R-value|U-value/i.test(x)).slice(0,30);
    await f.locator('.app-nav [data-page=report]').click();
    await f.locator('[data-study-print]').first().waitFor({state:'visible'});
    metrics.checks.reportText=(await frame.locator('body').innerText()).split('\n').map(x=>x.trim()).filter(x=>/Noor QA roof|Research|Sources|Method|ISO|PDF|resistance|U-factor/i.test(x)).slice(0,60);
    await frame.evaluate(()=>{window.print=()=>window.__noorQAPrint=true;});
    await f.locator('[data-study-print]').first().click();
    metrics.checks.printTriggered=await frame.evaluate(()=>Boolean(window.__noorQAPrint));
    if(!metrics.checks.printTriggered)throw Error('Print/PDF action did not invoke printing');
    await page.locator('#close-tool').click();
    await page.locator('#light-btn').click();
    await page.locator('[data-sun=morning]').click();
    metrics.checks.morning=await page.locator('[data-sun=morning]').getAttribute('aria-pressed');
  }
  if(mobile){
    metrics.checks.touchPad=await page.locator('[aria-label="Walk forward"]').isVisible();
    await page.getByRole('button',{name:'Guide',exact:true}).first().click();
    await page.locator('#sg-dialog[open] [data-guide-action="study"]').click();
    await page.frameLocator('#workbench').locator('#active-name').waitFor({state:'visible'});
    metrics.checks.mobileStudy=true;
  }
  metrics.ok=!metrics.pageErrors.length&&!metrics.errors.some(s=>/THREE.WebGLProgram: Shader Error|Studio loading|Uncaught|out of memory|context lost/i.test(s));
 }catch(err){metrics.ok=false;metrics.failure=String(err).slice(0,3200);}
 finally{fs.writeFileSync(path.join(out,stop+'.json'),JSON.stringify(metrics,null,2));console.log(JSON.stringify(metrics));if(browser)await browser.close();if(!metrics.ok)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exit(1);});
