import {normalize} from './curtain-model.mjs';
export function facadeLayout(input,explode=0){
 const p=normalize(input),gap=.055,depth=.18,split=Math.max(0,Math.min(1,Number(explode)||0)),cw=p.width/p.bays,ch=p.height/p.rows,parts=[];
 for(let row=0;row<p.rows;row++)for(let col=0;col<p.bays;col++)parts.push({kind:'panel',col,row,x:-p.width/2+(col+.5)*cw,y:p.height/2-(row+.5)*ch,z:split*(1.2+((col+row)%2)*.35),w:cw-gap,h:ch-gap,d:.032});
 for(let i=0;i<=p.bays;i++)parts.push({kind:'mullion',index:i,x:-p.width/2+i*cw,y:0,z:0,w:p.system==='ssg'&&i>0&&i<p.bays?.027:.065,h:p.height+.065,d:depth});
 for(let i=0;i<=p.rows;i++)parts.push({kind:'transom',index:i,x:0,y:p.height/2-i*ch,z:0,w:p.width,h:.065,d:depth});
 return {geometry:p,parts,width:p.width,height:p.height,depth,explode:split,notice:'Illustrative 3D frame depth, pane thickness and separation. Not a manufacturer section, glass build-up or fabrication model.'};
}
export function fitDistance(width,height,aspect=1,fov=42){const vertical=height/2/Math.tan(fov*Math.PI/360),horizontal=width/2/(Math.tan(fov*Math.PI/360)*Math.max(.25,aspect));return Math.max(vertical,horizontal)*1.32+1;}
export function heatAppearance(kw){const ratio=Math.max(0,Math.min(1,(Number(kw)||0)/12));return {ratio,hue:(195-190*ratio)/360,legendMaxKW:12};}
