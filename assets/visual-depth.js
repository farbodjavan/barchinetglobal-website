(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduce && 'IntersectionObserver' in window){
 const elements=document.querySelectorAll('.visual-heading,.visual-cycle,.diagram-lab,.diagram-split,.resident-strip,.review-demonstration,.three-options,.instrument-strip,.founders,.about-map');
 document.documentElement.classList.add('motion-ready');
 const visibility=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('is-in-viewport',e.isIntersecting)),{threshold:0});
 document.querySelectorAll('.visual-cycle').forEach(e=>visibility.observe(e));
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target)}}),{threshold:.07});
 elements.forEach(e=>{e.classList.add('motion-item');observer.observe(e)});
 const progress=document.createElement('div');progress.className='page-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 let ticking=false;const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;ticking=false};
 addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true}},{passive:true});update();
}
const press=(root,selector,button)=>root.querySelectorAll(selector).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
document.querySelectorAll('[data-room-lab]').forEach(lab=>{
 const data={open:['A place within the shared room.','Furniture defines a working corner. Conversation and daylight stay connected; acoustic privacy remains limited.','Connection ↔ concentration'],screen:['A boundary without a separate room.','A partial screen marks a working zone. It changes sightlines and furniture use, while sound can still travel around it.','Visual separation ↔ shared space'],closed:['A separate space, with new constraints.','A full enclosure changes circulation, light, ventilation and acoustic conditions. Each needs assessment before the option becomes a design.','Separation ↔ access and servicing']};
 lab.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>{press(lab,'[data-room]',b);lab.dataset.roomState=b.dataset.room;const d=data[b.dataset.room];['title','copy','trade'].forEach((key,i)=>lab.querySelector('[data-room-'+key+']').textContent=d[i])}));
});
document.querySelectorAll('[data-review-lab]').forEach(lab=>{
 const data={context:['A location worth reviewing.','The prototype points to a location and explains its criterion. A specialist still checks the geometry, applicability and available evidence.','Was the flag relevant and explainable?','CHECK CONTEXT'],false:['A flag that should be dismissed.','An opening may have been read incorrectly, or the criterion may not apply. Record why the warning was wrong and improve the method.','What caused an unnecessary warning?','RECHECK THE FLAG'],missing:['A result that cannot be decided yet.','If scale, geometry or the rule version is missing, show the gap. Request the missing information rather than treating uncertainty as a pass.','Which input is needed before a check?','INPUT REQUIRED'],missed:['An issue the prototype did not flag.','Compare the output with expert-reviewed cases. Investigate missing detections as well as visible warnings before considering product use.','What did the method fail to detect?','COMPARE REVIEW']};
 lab.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>{press(lab,'[data-case]',b);lab.dataset.reviewState=b.dataset.case;const d=data[b.dataset.case];['title','copy','result','label'].forEach((key,i)=>lab.querySelector('[data-case-'+key+']').textContent=d[i]);lab.querySelectorAll('[data-case-legend]').forEach(e=>e.textContent=d[3])}));
});
document.querySelectorAll('[data-pattern-lab]').forEach(lab=>lab.querySelectorAll('[data-pattern]').forEach(b=>b.addEventListener('click',()=>{press(lab,'[data-pattern]',b);lab.dataset.patternState=b.dataset.pattern})));
const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{maximumFractionDigits:d});
document.querySelectorAll('[data-tool-lab]').forEach(lab=>{
 const slider=lab.querySelector('[data-lab-slider]'),output=lab.querySelector('[data-lab-result]'),working=lab.querySelector('[data-lab-working]'),label=lab.querySelector('[data-lab-input]');
 const update=()=>{const v=Number(slider.value);const type=lab.dataset.toolLab;
  if(type==='tank-volume'){label.textContent=fmt(v)+'%';const y=340-272*v/100;lab.querySelector('[data-tank-water]').setAttribute('y',y);lab.querySelector('[data-tank-water]').setAttribute('height',272*v/100);lab.querySelector('[data-tank-surface]').setAttribute('d',`M174 ${y}Q218 ${y-7} 262 ${y}T350 ${y}T438 ${y}T526 ${y}`);output.textContent=fmt(2000*v/100,0)+' L';working.textContent=`2 × 1 × 1 × ${fmt(v)}% = ${fmt(2*v/100)} m³. Remaining space: ${fmt(2000*(1-v/100),0)} L.`;}
  if(type==='concrete-estimate'){label.textContent=fmt(v)+'%';output.textContent=fmt(2*(1+v/100))+' m³';working.textContent=`Base 5 × 2 × 0.2 = 2 m³. Reserve ${fmt(2*v/100)} m³. Total ${fmt(2*(1+v/100))} m³.`;lab.querySelector('[data-reserve-slab]').style.transform=`translateY(${-v/2}px)`;lab.querySelector('[data-reserve-slab]').style.opacity=String(.15+v/30);}
  if(type==='metal-weight'){label.textContent=fmt(v)+' m';const mass=Math.PI*.01*.01*v*7850;output.textContent=fmt(mass)+' kg';working.textContent=`π × 0.01² × ${fmt(v)} m × 7,850 kg/m³ = ${fmt(mass)} kg.`;lab.querySelector('[data-metal-bar]').setAttribute('transform',`translate(${350*(1-(.55+v/10))} 0) scale(${.55+v/10} 1)`);}
  if(type==='stair-geometry'){label.textContent=fmt(v)+' m';output.textContent=fmt(v/16*1000,1)+' mm / riser';working.textContent=`${fmt(v*1000,0)} mm ÷ 16 = ${fmt(v/16*1000,1)} mm. With 280 mm treads, the horizontal run is 4.2 m.`;let d='M130 340';for(let i=0;i<16;i++){d+=`v${-v*4.7}`;if(i<15)d+='h28';}lab.querySelector('[data-stair-steps]').innerHTML=`<path d="${d}"/>`;}
 };slider.addEventListener('input',update);slider.addEventListener('keydown',event=>{if(event.key==='Home'||event.key==='End'){event.preventDefault();slider.value=event.key==='Home'?slider.min:slider.max;update();}});update();
});
// Keep custom controls in sync with native video controls and failed playback.

if('IntersectionObserver' in window){const videoObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting&&!e.target.paused)e.target.pause()}),{threshold:0});document.querySelectorAll('video').forEach(v=>videoObserver.observe(v));}
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause())});
})();
