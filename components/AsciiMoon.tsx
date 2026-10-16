// Deterministic, small ASCII moon with strongly outlined craters.
const width=43;
const height=23;
const glyphs=" .,:;irsXA253hMHGS#9B&@";
const craters=[
 {x:-.37,y:-.27,r:.24},{x:.34,y:-.40,r:.18},{x:-.10,y:.35,r:.25},
 {x:.53,y:.18,r:.17},{x:-.61,y:.24,r:.12},{x:.05,y:-.08,r:.11}
];
function lunarCharacter(col:number,row:number){
 const x=(col-(width-1)/2)/((width-1)/2);
 const y=(row-(height-1)/2)/((height-1)/2);
 const r2=x*x+y*y;
 if(r2>1)return " ";
 const z=Math.sqrt(1-r2);
 const texture=Math.sin(x*31+y*17)*Math.cos(y*28-x*23)*.09+Math.sin(x*73-y*49)*.035;
 let shade=z*.7-x*.26+texture+.17;
 let craterMark="";
 for(const c of craters){
  const d=Math.hypot(x-c.x,y-c.y);
  const delta=d-c.r;
  if(Math.abs(delta)<.055){craterMark=delta<0?"@":"#";break}
  if(d<c.r*.75){shade-=.54;craterMark=d<c.r*.44?":":"."}
  else if(d<c.r){shade-=.33;craterMark="o"}
 }
 if(craterMark)return craterMark;
 const idx=Math.max(1,Math.min(glyphs.length-1,Math.floor(shade*(glyphs.length-1)*.9)));
 return glyphs[idx];
}
const lunarArt=Array.from({length:height},(_,row)=>Array.from({length:width},(_,col)=>lunarCharacter(col,row)).join("")).join("\n");
export default function AsciiMoon(){
 return <div className="home-ascii-moon" aria-hidden="true"><pre>{lunarArt}</pre></div>;
}
