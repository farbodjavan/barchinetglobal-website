const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const { chromium }=require(process.env.PW_MODULE);
const out='qa-output';fs.mkdirSync(out,{recursive:true});
const origin='http://127.0.0.1:8181/';
const timeout=150000;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const errors=[],shaderErrors=[],metrics={};
 async function pageAt(key,viewport) {
   const p=await browser.newPage({viewport,deviceScaleFactor:1,hasTouch:key==='mobile',isMobile:key==='mobile'});
   p.setDefaultTimeout(30000);
   p.on('pageerror',error=>{errors.push(key+': '+error.message);console.log('pageerror',error.message);});
   p.on('console',msg=>{if(/Shader Error|VALIDATE_STATUS false|Failed to compile shader|Program Info Log.*error/i.test(msg.text())) shaderErrors.push(key+': '+msg.text().slice(0,650));});
   await p.addInitScript(()=>{document.addEventListener('noor-first-view',()=>{window.__firstNoorView=performance.now()},{once:true})});
   await p.goto(origin,{waitUntil:'domcontentloaded',timeout});
   await p.waitForFunction(()=>window.__firstNoorView>0,{},{timeout});
   await p.locator('#studio-loading').waitFor({state:'hidden',timeout});
   await p.waitForFunction(()=>!document.body.classList.contains('walking-fallback') && document.querySelector('#room-name')?.textContent.trim()==='Reception');
   await p.waitForFunction(()=>{const c=document.querySelector('#view'),r=c.getBoundingClientRect();const item=document.elementFromPoint(r.left+r.width*.52,r.top+r.height*.48);return item===c||item?.closest('#spot');},null,{timeout});
   for(const sel of ['.mast [data-panel="brief"]','.mast [data-panel="examples"]','.mast [data-feature="workbench"]']) assert.equal(await p.locator(sel).isVisible(),true);
   metrics[key]=await p.evaluate(()=>({reception:document.querySelector('#room-name').textContent,firstFrameMs:Math.round(window.__firstNoorView),viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,canvasWidth:document.querySelector('#view').width,renderer:document.querySelector('#view').getContext('webgl2')?.getParameter(7937)||'WebGL'}));
   assert.ok(metrics[key].scrollWidth<=viewport.width+1);
   await p.screenshot({path:path.join(out,key+'-reception.png'),timeout});return p;
 }
 try {
   const p=await pageAt('desktop',{width:1440,height:900});
   await p.locator('.mast [data-panel="examples"]').click();
   for(const kind of ['wall','roof','floor']) assert.equal(await p.locator('#sheet-body [data-kind="'+kind+'"]').isVisible(),true);
   await p.locator('#close-sheet').click();
   await p.locator('.mast [data-panel="brief"]').click();
   await p.locator('#brief-form [name="name"]').fill('Noor QA Roof');
   await p.locator('#brief-form [name="kind"]').selectOption('roof');
   await p.locator('#brief-form [name="goals"]').fill('Compare roof insulation for renovation.');
   await p.locator('#brief-form button[type="submit"]').click();
   await p.locator('#tool-dialog[open]').waitFor();
   const app=p.frameLocator('#workbench');
   const roof=app.locator('.assembly-tabs [data-kind="roof"]');
   await roof.waitFor();
   const state=await roof.evaluate(el=>({cls:el.className,sel:el.getAttribute('aria-selected'),pressed:el.getAttribute('aria-pressed'),current:el.getAttribute('aria-current')}));
   assert.ok(state.pressed==='true'||state.sel==='true'||['true','page'].includes(state.current)||/active|selected|current/.test(state.cls),JSON.stringify(state));
   await app.locator('.app-nav [data-page="report"]').click();
   const fullPrint=app.locator('[data-study-print]').first();await fullPrint.waitFor();
   await fullPrint.evaluate(el=>{el.ownerDocument.defaultView.print=()=>{};});await fullPrint.click();
   const rt=await app.locator('#print-sheet').textContent();
   for(const phrase of ['Noor QA Roof','Compare roof insulation for renovation.']) assert.ok(rt.includes(phrase),'missing '+phrase);
   assert.ok(/roof/i.test(rt));assert.ok(/source|reference/i.test(rt));
   await p.screenshot({path:path.join(out,'roof-report.png'),timeout});
   await p.close();
   const m=await pageAt('mobile',{width:390,height:844});
   await m.locator('.mast [data-panel="brief"]').click();
   await m.locator('#brief-form [name="name"]').fill('Mobile study');
   assert.ok(await m.locator('#brief-form button[type="submit"]').isVisible());
   await m.screenshot({path:path.join(out,'mobile-brief.png'),timeout});
   await m.close();
   assert.deepEqual(shaderErrors,[]);assert.deepEqual(errors,[]);
   console.log('PASS '+JSON.stringify(metrics));
 } finally {
   fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({metrics,errors,shaderErrors},null,2));
   await browser.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1});