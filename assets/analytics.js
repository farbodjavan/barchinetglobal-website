/* Barchinet website analytics. No Google requests before opt-in. */
(() => {
  'use strict';
  if (!['barchinetglobal.com', 'www.barchinetglobal.com', 'localhost', '127.0.0.1'].includes(location.hostname)) return;
  const ID = 'G-97S46VVBPS', KEY = 'barchinet.analytics.v1', MAX_AGE = 180 * 86400000;
  let enabled = false, initialized = false, panel;
  const isProduction = /^(www\.)?barchinetglobal\.com$/.test(location.hostname);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('consent', 'default', {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  function preference() {
    try { const p = JSON.parse(localStorage.getItem(KEY)); return p && ['accepted','rejected'].includes(p.value) && Date.now()-p.time >= 0 && Date.now()-p.time < MAX_AGE ? p.value : null; } catch { return null; }
  }
  function pageLocation() {
    const url = new URL(location.origin + location.pathname);
    const input = new URLSearchParams(location.search);
    for (const k of ['utm_source','utm_medium','utm_campaign']) {
      const v = input.get(k); if (v && /^[a-zA-Z0-9_. -]{1,80}$/.test(v)) url.searchParams.set(k,v);
    }
    return url.href;
  }
  function clearCookies() {
    for (const entry of document.cookie.split(';')) {
      const name = entry.trim().split('=')[0];
      if (/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) {
        for (const domain of ['', ';domain='+location.hostname, ';domain=.barchinetglobal.com']) document.cookie = name+'=;max-age=0;path=/'+domain+';SameSite=Lax';
      }
    }
  }
  function activate() {
    enabled = true; window['ga-disable-'+ID] = false;
    gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    if (initialized) return;
    initialized = true;
    gtag('js',new Date());
    let referrer = ''; try { referrer = new URL(document.referrer).origin; } catch {}
    gtag('config', ID, {send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:'barchinetglobal.com',cookie_expires:15552000,page_location:pageLocation(),page_referrer:referrer});
    gtag('event','page_view',{page_location:pageLocation(),page_referrer:referrer,page_title:document.title});
    if (isProduction) {const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.append(script);}
  }
  function choose(value) {
    try {localStorage.setItem(KEY,JSON.stringify({value,time:Date.now()}));} catch {}
    panel.hidden = true;
    if (value==='accepted') activate(); else {
      enabled=false; window['ga-disable-'+ID]=true;
      gtag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      clearCookies();
      if (initialized && isProduction) { location.reload(); return; }
    }
    document.querySelector('[data-analytics-settings]')?.focus({preventScroll:true});
  }
  const style=document.createElement('link');style.rel='stylesheet';style.href='/assets/analytics.css?v=20261104';document.head.append(style);
  panel=document.createElement('section');panel.className='analytics-choice';panel.setAttribute('aria-labelledby','analytics-choice-title');panel.hidden=true;
  panel.innerHTML='<div><h2 id="analytics-choice-title">Your privacy, your choice</h2><p>May we use Google Analytics to understand visits and improve this website? It uses cookies to measure pages, traffic sources and approximate location. <a href="/website-privacy.html">Website privacy</a></p></div><div class="analytics-actions"><button type="button" data-analytics-reject>Reject analytics</button><button type="button" data-analytics-accept>Accept analytics</button></div>';
  document.body.append(panel);
  panel.querySelector('[data-analytics-accept]').addEventListener('click',()=>choose('accepted'));
  panel.querySelector('[data-analytics-reject]').addEventListener('click',()=>choose('rejected'));
  const footer=document.querySelector('footer') || document.body;
  const settings=document.createElement('button');settings.type='button';settings.className='analytics-settings';settings.setAttribute('data-analytics-settings','');settings.textContent='Cookie settings';settings.addEventListener('click',()=>{panel.hidden=false;panel.querySelector('button').focus();});footer.append(settings);
  const policy=document.createElement('a');policy.href='/website-privacy.html';policy.className='analytics-policy-link';policy.textContent='Website privacy';footer.append(policy);
  const pref=preference();
  if (pref==='accepted') activate(); else {window['ga-disable-'+ID]=true;if(!pref)panel.hidden=false;}
  document.addEventListener('click',event=>{
    if (!enabled) return;
    const link=event.target.closest('a[href]');if(!link)return;
    let url;try{url=new URL(link.href);}catch{return;}
    // Send only a destination category/domain, never a form value or email address.
    const kind=url.protocol==='mailto:'?'email':url.protocol==='https:'&&url.hostname!==location.hostname?'outbound':null;
    if(kind)gtag('event','contact_or_outbound',{destination:kind==='email'?'email':url.hostname,page_location:pageLocation()});
  });
})();
