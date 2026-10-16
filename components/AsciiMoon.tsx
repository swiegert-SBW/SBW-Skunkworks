// Deterministic server-rendered ASCII moon: no images, dependencies, or hydration.
const width=43;
const height=23;
const glyphs=" .,:;irsXA253hMHGS#9B&@";
const craters=[
 {x:-.38,y:-.29,r:.22},{x:.35,y:-.41,r:.17},{x:-.12,y:.36,r:.24},
 {x:.52,y:.19,r:.15},{x:-.61,y:.23,r:.11},{x:.06,y:-.06,r:.09}
];
function lunarCharacter(col:number,row:number){
 const x=(col-(width-1)/2)/((width-1)/2);
 const y=(row-(height-1)/2)/((height-1)/2);
 const r2=x*x+y*y;
 if(r2>1)return " ";
 const z=Math.sqrt(1-r2);
 const noise=Math.sin(x*39+y*17)*Math.cos(y*34-x*19)*.10+Math.sin(x*82-y*67)*.045;
 let crater=0;
 for(const c of craters){
  const d=Math.hypot(x-c.x,y-c.y);
  const rim=Math.exp(-Math.pow((d-c.r)/.035,2))*.22;
  const basin=d<c.r?-.21*(1-d/c.r):0;
  crater+=rim+basin;
 }
 const light=Math.max(0,(z*.84-x*.46+y*.10)+noise+crater);
 const shade=Math.min(glyphs.length-1,Math.max(1,Math.floor(light*(glyphs.length-1)*.88)));
 return glyphs[shade];
}
const lunarArt=Array.from({length:height},(_,row)=>Array.from({length:width},(_,col)=>lunarCharacter(col,row)).join("")).join("\n");
export default function AsciiMoon(){
 return <div className="home-ascii-moon" aria-hidden="true"><pre>{lunarArt}</pre></div>;
}
