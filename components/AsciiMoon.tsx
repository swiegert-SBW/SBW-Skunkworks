"use client";
import {useEffect,useMemo,useState} from "react";

// Near-side lunar maria are irregular dark basalt plains, not oversized round craters.
// Approximate visible locations in a north-up view; ASCII art, not a lunar photograph.
const WIDTH=55,HEIGHT=29;
const terrain=[
 [-.55,-.08,.35,.56,.38], // Oceanus Procellarum
 [-.28,-.48,.29,.24,.48], // Mare Imbrium
 [.25,-.39,.24,.20,.47],  // Mare Serenitatis
 [.30,-.05,.28,.22,.52],  // Mare Tranquillitatis
 [.67,-.17,.14,.17,.52],  // Mare Crisium
 [-.12,.31,.29,.21,.37],  // Mare Nubium
 [.18,.48,.23,.16,.27],   // Mare Fecunditatis
 [-.46,.50,.18,.16,.29],  // Mare Humorum
];
const craters=[
 [-.30,-.02,.055], // Copernicus
 [-.19,.64,.050], // Tycho
 [-.68,-.30,.032], // Aristarchus
 [.09,-.57,.038], // Plato
 [.40,.39,.034], // Langrenus region
];
const newMoon=Date.parse("2026-10-10T15:50:00Z");
const lunarMonth=29.530588853*86400000;
function phaseAt(date:Date){return ((date.getTime()-newMoon)%lunarMonth+lunarMonth)%lunarMonth/lunarMonth}
function drawMoon(phase:number){
 const angle=phase*2*Math.PI;
 // Waxing is lit on the right; waning on the left. Orthographic sphere lighting.
 const sunX=Math.sin(angle),sunZ=-Math.cos(angle);
 const glyphs="  ..,,::;;ii11ttffLLCCGGOO##@@";
 const lines:string[]=[];
 for(let row=0;row<HEIGHT;row++){
  let line="";
  for(let col=0;col<WIDTH;col++){
   const x=(col-(WIDTH-1)/2)/((WIDTH-1)/2);
   const y=(row-(HEIGHT-1)/2)/((HEIGHT-1)/2);
   const r2=x*x+y*y;
   if(r2>1){line+=" ";continue}
   const z=Math.sqrt(Math.max(0,1-r2));
   const light=x*sunX+z*sunZ;
   if(light<=0){line+=" ";continue}
   const noise=(Math.sin(x*57+y*19)*Math.cos(y*37-x*28)+Math.sin(x*121-y*93)*.4)*.048;
   let density=.65+noise;
   for(const [cx,cy,rx,ry,depth] of terrain){
    const dx=(x-cx)/rx,dy=(y-cy)/ry;
    const irregular=1+.14*Math.sin(7*x+9*y)+.10*Math.cos(19*x-5*y);
    if(dx*dx+dy*dy<irregular) density-=depth*(.72+.28*Math.max(0,1-(dx*dx+dy*dy)));
   }
   for(const [cx,cy,r] of craters){
    const d=Math.hypot(x-cx,y-cy);
    if(Math.abs(d-r)<.025)density+=.30;
    else if(d<r*.75)density-=.26;
   }
   // Slightly brighter near the subsolar side, with soft falloff at terminator.
   density=Math.max(0,Math.min(1,(density+.13*z)*(.67+.33*Math.min(1,light*3))));
   line+=glyphs[Math.max(2,Math.min(glyphs.length-1,Math.floor(density*(glyphs.length-1))))];
  }
  lines.push(line);
 }
 return lines.join("\n");
}
export default function AsciiMoon(){
 const [phase,setPhase]=useState<number|null>(null);
 useEffect(()=>{
  const update=()=>setPhase(phaseAt(new Date()));
  update();const timer=window.setInterval(update,60*60*1000);
  return()=>window.clearInterval(timer);
 },[]);
 const art=useMemo(()=>phase===null?"":drawMoon(phase),[phase]);
 return <div className="home-ascii-moon" aria-hidden="true" title="Approximate current lunar phase near Neenah, Wisconsin"><pre>{art}</pre></div>;
}
