"use client";
import {useEffect,useMemo,useRef,useState} from "react";
// NASA LRO near-side lunar imagery, NASA/GSFC/ASU:
// https://science.nasa.gov/resource/lunar-near-side/
// The phase is approximate; the dark side remains visible as subdued earthshine.
const image="https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/l/lro_nearside.jpg?crop=faces%2Cfocalpoint&fit=clip&h=1881&w=1936";
const newMoon=Date.parse("2026-10-10T15:50:00Z");
const lunarMonth=29.530588853*86400000;
function lunarPhase(date:Date){return ((date.getTime()-newMoon)%lunarMonth+lunarMonth)%lunarMonth/lunarMonth}
function shadowPath(phase:number){
 const angle=phase*2*Math.PI;
 const boundary=Array.from({length:101},(_,i)=>{
  const y=-1+i/50;
  const x=Math.cos(angle)*Math.sqrt(Math.max(0,1-y*y));
  return [100+100*x,100+100*y] as const;
 });
 const start=phase<.5?"M 0 0 L 100 0 ":"M 200 0 L 100 0 ";
 const end=phase<.5?"L 0 200 Z":"L 200 200 Z";
 return start+boundary.map(([x,y])=>"L "+x.toFixed(2)+" "+y.toFixed(2)).join(" ")+end;
}
export default function AsciiMoon(){
 const [phase,setPhase]=useState<number|null>(null);
 const audioRef=useRef<AudioContext|null>(null);
 const blastRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{const update=()=>setPhase(lunarPhase(new Date()));update();const id=window.setInterval(update,3600000);return()=>window.clearInterval(id)},[]);
 const path=useMemo(()=>phase===null?"":shadowPath(phase),[phase]);
 useEffect(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const play=()=>{
   if(document.hidden)return;
   const ctx=audioRef.current;
   if(!ctx||ctx.state!=="running")return;
   const seconds=1.3;
   const count=Math.floor(ctx.sampleRate*seconds);
   const buffer=ctx.createBuffer(1,count,ctx.sampleRate);
   const channel=buffer.getChannelData(0);
   for(let i=0;i<count;i++){
    const t=i/ctx.sampleRate;
    channel[i]=(Math.random()*2-1)*Math.exp(-t*4.5);
   }
   const noise=ctx.createBufferSource();noise.buffer=buffer;
   const filter=ctx.createBiquadFilter();filter.type="lowpass";filter.frequency.setValueAtTime(1000,ctx.currentTime);filter.frequency.exponentialRampToValueAtTime(90,ctx.currentTime+seconds);
   const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.26,ctx.currentTime+.03);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+seconds);
   noise.connect(filter);filter.connect(gain);gain.connect(ctx.destination);noise.start();noise.stop(ctx.currentTime+seconds);
  };
  // Read the actual CSS animation clock, rather than starting a new timer
  // when the visitor enables sound. This keeps sound aligned with the flash.
  let lastCycle=-1;
  const sync=()=>{
   if(document.hidden)return;
   const animation=blastRef.current?.getAnimations().find(a=>(a.effect as KeyframeEffect|null)?.getTiming().duration===30000);
   if(!animation)return;
   const time=Number(animation.currentTime);
   if(!Number.isFinite(time))return;
   const cycle=Math.floor(time/30000);
   const progress=(time%30000)/30000;
   if(lastCycle<0){lastCycle=cycle;return}
   if(progress>=.823&&progress<.838&&lastCycle===cycle){
    lastCycle=cycle+1;
    play();
   }else if(progress<.823&&lastCycle<cycle){lastCycle=cycle}
  };
  const interval=window.setInterval(sync,80);
  sync();
  return()=>window.clearInterval(interval);
 },[]);
 useEffect(()=>()=>{if(audioRef.current)void audioRef.current.close()},[]);
 useEffect(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const unlock=()=>{
   try{
    const ctx=audioRef.current||new AudioContext();
    audioRef.current=ctx;
    void ctx.resume().then(()=>{if(ctx.state==="running")detach()}).catch(()=>{});
   }catch{}
  };
  const detach=()=>{
   window.removeEventListener("pointerdown",unlock);
   window.removeEventListener("keydown",unlock);
   window.removeEventListener("touchstart",unlock);
  };
  window.addEventListener("pointerdown",unlock,{passive:true});
  window.addEventListener("keydown",unlock);
  window.addEventListener("touchstart",unlock,{passive:true});
  unlock();
  return detach;
 },[]);
 return <div className="home-lunar-scene">
  <div className="home-ascii-moon home-photo-moon" aria-hidden="true" title="NASA lunar near-side imagery with approximate current phase">
   <div className="home-photo-moon-disc" style={{backgroundImage:'url("'+image+'")'}} />
   {path&&<svg className="home-photo-moon-shadow" viewBox="0 0 200 200" preserveAspectRatio="none"><path d={path} fill="#050a13" fillOpacity=".82"/></svg>}
  </div>
  <div className="home-death-star" aria-hidden="true">
   <svg viewBox="0 0 120 120" role="presentation" focusable="false">
    <defs><radialGradient id="death-star-shell" cx="30%" cy="25%" r="85%"><stop offset="0" stopColor="#adb8c4"/><stop offset=".58" stopColor="#667380"/><stop offset="1" stopColor="#1c2938"/></radialGradient><clipPath id="death-star-disc"><circle cx="60" cy="60" r="56"/></clipPath></defs>
    <circle cx="60" cy="60" r="56" fill="url(#death-star-shell)" stroke="#9faab4" strokeWidth="1"/>
    <g clipPath="url(#death-star-disc)" fill="none" stroke="#283846" strokeWidth="2" opacity=".72">
     <path d="M4 40H116M4 51H116M4 65H116M4 76H116M4 92H116M16 12V110M34 5V115M81 5V115M101 12V110" strokeDasharray="23 7 11 4"/>
     <path d="M7 59H113" strokeWidth="5"/>
     <path d="M19 24h29m21 0h27M17 101h31m20 0h28" strokeWidth="4"/>
    </g>
    <ellipse cx="79" cy="40" rx="20" ry="17" fill="#293846" stroke="#c1c9cd" strokeWidth="2"/>
    <ellipse cx="79" cy="40" rx="12" ry="10" fill="#586b72" stroke="#172733" strokeWidth="2"/>
    <circle cx="79" cy="40" r="4" fill="#a8b8ba"/>
   </svg>
   <svg className="home-death-star-converge" viewBox="0 0 120 120" aria-hidden="true"><g stroke="#83ff9a" strokeWidth=".85" strokeLinecap="round"><line x1="79" y1="27" x2="79" y2="40"/><line x1="67" y1="35" x2="79" y2="40"/><line x1="91" y1="35" x2="79" y2="40"/><line x1="70" y1="48" x2="79" y2="40"/><line x1="88" y1="48" x2="79" y2="40"/></g></svg>
   <div className="home-death-star-charge"/>
  </div>
  <div className="home-death-star-beam" aria-hidden="true"/>
  <div ref={blastRef} className="home-moon-blast" aria-hidden="true"/>
  <div className="home-moon-debris" aria-hidden="true">{Array.from({length:9},(_,i)=><span key={i} className={`home-moon-fragment home-moon-fragment-${i+1}`} style={{backgroundImage:'url("'+image+'")'}}/>)}</div>
 </div>;
}
