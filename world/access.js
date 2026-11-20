'use strict';
(() => {
  const utf8 = new TextEncoder(), decoder = new TextDecoder();
  const crypt = globalThis.crypto?.subtle;
  const rootURL = new URL('./', location.href);
  const virtualBase = 'https://private.invalid/';
  const blobURLs = new Set();
  const bytes = b64 => Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  function b64(raw) {
    let s = '';
    for (let i=0;i<raw.length;i+=32768) s+=String.fromCharCode(...raw.subarray(i,i+32768));
    return btoa(s);
  }
  const b64url = raw => b64(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const fromUrl = s => bytes(s.replace(/-/g,'+').replace(/_/g,'/'));
  function blob(value,type) {
    const url=URL.createObjectURL(new Blob([value],{type})); blobURLs.add(url); return url;
  }
  function revoke() { for(const url of blobURLs) URL.revokeObjectURL(url); blobURLs.clear(); }
  async function network(path,wantJSON=false) {
    const response=await fetch(new URL(path,rootURL),{cache:'no-store',credentials:'same-origin',referrerPolicy:'no-referrer'});
    if(!response.ok) throw Error('network');
    return wantJSON?response.json():response.text();
  }
  const aes = (raw,uses) => crypt.importKey('raw',raw,'AES-GCM',false,uses);
  const gcm = (iv,purpose) => ({name:'AES-GCM',iv,additionalData:utf8.encode(purpose),tagLength:128});
  async function openPackage(account,password,progress) {
    const meta=await network('p.json',true);
    if(meta.v!==1 || !Array.isArray(meta.slots) || meta.slots.length!==2 || !Number.isInteger(meta.iterations) || meta.iterations<600000 || meta.iterations>2000000 || !Array.isArray(meta.chunks) || !meta.chunks.length || meta.chunks.length>4096 || !Number.isSafeInteger(meta.size) || meta.size<17 || meta.size>512*1024*1024) throw Error('network');
    const pw=await crypt.importKey('raw',utf8.encode(account+'\0'+password),'PBKDF2',false,['deriveKey']);
    let pkg;
    for(const [salt,iv,cipher] of meta.slots) {
      const key=await crypt.deriveKey({name:'PBKDF2',salt:bytes(salt),iterations:meta.iterations,hash:'SHA-256'},pw,{name:'AES-GCM',length:256},false,['decrypt']);
      try{const raw=new Uint8Array(await crypt.decrypt(gcm(bytes(iv),'BW-envelope-v1'),key,bytes(cipher)));pkg=await aes(raw,['decrypt']);raw.fill(0);}catch(e){if(e.name!=='OperationError')throw e;}
    }
    if(!pkg) throw Error('credentials');
    progress();
    if(!meta.chunks.every(x=>/^b[0-9a-f]{12}\.dat$/.test(x)))throw Error('network');
    const ciphertext=new Uint8Array(meta.size);let offset=0;
    for(const name of meta.chunks){const block=bytes(await network(name));ciphertext.set(block,offset);offset+=block.length;}
    if(offset!==meta.size)throw Error('network');
    const packed=await crypt.decrypt(gcm(bytes(meta.iv),'BW-package-v1'),pkg,ciphertext);
    const payload=await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
    if(payload.v!==1||!payload.files?.['index.html']||typeof payload.workspace!=='string')throw Error('bundle');
    return payload;
  }
  async function makeBridge(account,workspace,raw) {
    const hkdf=await crypt.importKey('raw',raw,'HKDF',false,['deriveKey']); raw.fill(0);
    const keyFor=purpose=>crypt.deriveKey({name:'HKDF',hash:'SHA-256',salt:utf8.encode(workspace),info:utf8.encode('BW-purpose-v1:'+purpose)},hkdf,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    const stateKey=await keyFor('state'),peerKey=await keyFor('peer');
    const aad=kind=>'BW-v1:'+workspace+':'+kind;
    async function seal(value,key,kind){
      const iv=crypto.getRandomValues(new Uint8Array(12)), valueBytes=utf8.encode(JSON.stringify(value));
      const cipher=new Uint8Array(await crypt.encrypt(gcm(iv,aad(kind)),key,valueBytes));
      const out=new Uint8Array(iv.length+cipher.length);out.set(iv);out.set(cipher,iv.length);return b64url(out);
    }
    async function open(envelope,key,kind){
      if(typeof envelope!=='string'||envelope.length<38||envelope.length>90*1024*1024||!/^[A-Za-z0-9_-]+$/.test(envelope))throw Error('Invalid encrypted data');
      const data=fromUrl(envelope);
      const plain=await crypt.decrypt(gcm(data.slice(0,12),aad(kind)),key,data.slice(12));
      return JSON.parse(decoder.decode(plain));
    }
    let dbPromise;
    function db() {
      if(!dbPromise) dbPromise=new Promise((ok,fail)=>{
        const req=indexedDB.open('bw-private-v1',1);
        req.onupgradeneeded=()=>req.result.createObjectStore('storage');
        req.onerror=()=>{dbPromise=undefined;fail(req.error)};
        req.onblocked=()=>{dbPromise=undefined;fail(Error('Storage blocked by another tab'))};
        req.onsuccess=()=>{const connection=req.result;connection.onversionchange=()=>{connection.close();dbPromise=undefined};ok(connection)};
      });
      return dbPromise;
    }
    async function transact(mode,fn) {
      const database=await db();
      return new Promise((ok,fail)=>{
        const tx=database.transaction('storage',mode);const request=fn(tx.objectStore('storage'));
        tx.oncomplete=()=>ok(request.result);tx.onabort=()=>fail(tx.error||Error('Storage transaction cancelled'));
        tx.onerror=()=>fail(tx.error||Error('Storage error'));
      });
    }
    let queued=Promise.resolve();
    async function readState(){await queued;const encrypted=await transact('readonly',store=>store.get(workspace));return encrypted?open(encrypted,stateKey,'state'):null;}
    function writeState(value){
      const copied=JSON.parse(JSON.stringify(value));
      const action=queued.then(async()=>{const data=await seal(copied,stateKey,'state');await transact('readwrite',store=>store.put(data,workspace));});
      queued=action.catch(()=>{});return action;
    }
    async function exportState(){
      const state=await readState();const encrypted=await seal(state,stateKey,'transfer');
      return new Blob([JSON.stringify({v:1,payload:encrypted})],{type:'application/octet-stream'});
    }
    async function readSnapshot(file) {
      if(!file||file.size>65*1024*1024)throw Error('Invalid snapshot size');
      const data=JSON.parse(await file.text());if(data.v!==1)throw Error('Unsupported snapshot');
      const obj=await open(data.payload,stateKey,'transfer');if(obj===null||typeof obj!=='object'||Array.isArray(obj))throw Error('Empty snapshot');
      return obj;
    }
    async function importState(file){const obj=await readSnapshot(file);await writeState(obj);return obj;}
    function logout(){
      revoke();
      delete globalThis.WORLD_ASSETS;
      delete globalThis.WORLD_SECURITY;
      document.body.replaceChildren();
      try { history.replaceState(null,'',rootURL.href); } finally { location.reload(); }
    }
    return Object.freeze({account,readState,writeState,exportState,readSnapshot,importState,logout,
      sealMessage:obj=>seal(obj,peerKey,'peer'),openMessage:msg=>open(msg,peerKey,'peer')});
  }
  function localPath(ref,base) {
    if(!ref||ref.startsWith('#')||ref.startsWith('//')||/^[a-z][a-z\d+.\-]*:/i.test(ref))return null;
    return decodeURIComponent(new URL(ref,new URL(base,virtualBase)).pathname.slice(1));
  }
  function mapFiles(files) {
    const urls=Object.create(null), modules=Object.create(null),buildingCSS=new Set();
    const source=path=>decoder.decode(bytes(files[path][1]));
    function pathRef(ref,path){const dest=localPath(ref,path);return dest && Object.hasOwn(files,dest)?dest:null;}
    function cssText(str,path){
      return str.replace(/url\(\s*(?:(["'])(.*?)\1|([^)'"]+))\s*\)/gi,(match,_quote,quoted,plain)=>{
        const ref=(quoted??plain).trim(),dest=pathRef(ref,path);return dest?'url("'+asset(dest)+(ref.includes('#')?ref.slice(ref.indexOf('#')):'')+'")':match;
      }).replace(/(@import\s+)(["'])([^"']+)\2/g,(m,start,q,ref)=>{const dest=pathRef(ref,path);return dest?start+q+asset(dest)+q:m;});
    }
    function rewriteJS(str,path){
      // Rewrite literal module paths to stable names; import maps also support module cycles.
      return str.replace(/(\b(?:from\s*|import\s*(?:\(\s*)?))(["'])(\.{1,2}\/[^"'\n]+)\2/g,(m,start,q,ref)=>{
        const dest=pathRef(ref,path);if(!dest)throw Error('Missing module '+ref+' in '+path);
        return start+q+'bw:/'+dest+q;
      }).replace(/new URL\(\s*(["'])([^"'\n]+)\1\s*,\s*import\.meta\.url\s*\)/g,(m,_quote,ref)=>{
        const dest=pathRef(ref,path);return dest?'new URL(globalThis.WORLD_ASSETS['+JSON.stringify(dest)+'])':m;
      });
    }
    function asset(path){
      if(urls[path])return urls[path];
      const [type,encoded]=files[path];
      if(type==='text/css'){
        if(buildingCSS.has(path))throw Error('Cyclic stylesheet');
        buildingCSS.add(path);try{urls[path]=blob(cssText(source(path),path),type);}finally{buildingCSS.delete(path);}
      } else if(type==='text/javascript'){
        urls[path]=blob(rewriteJS(source(path),path),type);modules['bw:/'+path]=urls[path];
      }else urls[path]=blob(bytes(encoded),type);
      return urls[path];
    }
    for(const path of Object.keys(files))asset(path);
    return {urls:Object.freeze(urls),imports:modules,source,cssText,rewriteJS,pathRef};
  }
  async function mount(payload,account) {
    const bridge=await makeBridge(account,payload.workspace,bytes(payload.stateKey));delete payload.stateKey;
    const {urls,imports,source,cssText,rewriteJS,pathRef}=mapFiles(payload.files);
    const entry='index.html',doc=new DOMParser().parseFromString(source(entry),'text/html');
    if(!doc.body)throw Error('bundle');
    const scripts=[];
    doc.querySelectorAll('script').forEach(script=>{
      if(script.type==='application/json')return;
      if(script.type==='importmap')throw Error('App-supplied import maps are not supported');
      const spec={type:script.type,src:script.getAttribute('src'),code:script.textContent};scripts.push(spec);script.remove();
    });
    for(const el of doc.querySelectorAll('[src],[href],[poster],[style],style')){
      for(const attr of ['src','href','poster']){
        const ref=el.getAttribute(attr);const dest=pathRef(ref,entry);if(dest)el.setAttribute(attr,urls[dest]);
      }
      if(el.tagName==='STYLE')el.textContent=cssText(el.textContent,entry);
      if(el.hasAttribute('style'))el.setAttribute('style',cssText(el.getAttribute('style'),entry));
    }
    Object.defineProperty(globalThis,'WORLD_ASSETS',{value:urls,configurable:true});
    Object.defineProperty(globalThis,'WORLD_SECURITY',{value:bridge,configurable:true});
    if(doc.documentElement.lang)document.documentElement.lang=doc.documentElement.lang;
    if(doc.documentElement.dir)document.documentElement.dir=doc.documentElement.dir;
    document.head.replaceChildren(...Array.from(doc.head.childNodes).map(n=>document.importNode(n,true)));
    document.body.replaceChildren(...Array.from(doc.body.childNodes).map(n=>document.importNode(n,true)));
    for(const attr of doc.body.attributes)document.body.setAttribute(attr.name,attr.value);
    const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
    for(const item of scripts){
      if(item.type && !['module','text/javascript','application/javascript'].includes(item.type))continue;
      const node=document.createElement('script');if(item.type)node.type=item.type;node.async=false;
      if(item.src){const dest=pathRef(item.src,entry);if(!dest)throw Error('Non-local application script');node.src=urls[dest];}
      else if(item.type==='module')node.src=blob(rewriteJS(item.code,entry),'text/javascript');
      else node.textContent=item.code;
      if(node.src)await new Promise((ok,fail)=>{node.onload=ok;node.onerror=()=>fail(Error('Script load failed'));document.body.append(node);});
      else document.body.append(node);
    }
  }
  const form=document.getElementById('access-form'),status=document.getElementById('access-status'),button=document.getElementById('unlock');
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(button.disabled)return;
    if(!crypt||!globalThis.DecompressionStream){status.textContent='برای ورود، این صفحه را با مرورگر به‌روز و اتصال امن باز کن.';return;}
    const account=document.getElementById('account').value.trim().toLowerCase(),field=document.getElementById('password');
    button.disabled=true;status.textContent='در حال بررسی ورود…';
    try{
      const pkg=await openPackage(account,field.value,()=>status.textContent='در حال باز کردن فضای خصوصی…');field.value='';await mount(pkg,account);
    }catch(error){
      field.value='';button.disabled=false;const message=error.message==='credentials'?'نام کاربری یا رمز عبور درست نیست.':'باز کردن فضای خصوصی ممکن نشد. صفحه را تازه‌سازی کن و دوباره امتحان کن.';
      if(status.isConnected){status.textContent=message;field.focus();}
      else {revoke();document.body.replaceChildren();const alert=document.createElement('p');alert.textContent=message;document.body.append(alert);}
    }
  });
  window.addEventListener('pagehide',revoke);
  window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
})();
