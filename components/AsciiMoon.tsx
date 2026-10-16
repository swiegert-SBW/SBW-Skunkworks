"use client";
import {useEffect,useMemo,useState} from "react";
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
 useEffect(()=>{const update=()=>setPhase(lunarPhase(new Date()));update();const id=window.setInterval(update,3600000);return()=>window.clearInterval(id)},[]);
 const path=useMemo(()=>phase===null?"":shadowPath(phase),[phase]);
 return <div className="home-ascii-moon home-photo-moon" aria-hidden="true" title="NASA lunar near-side imagery with approximate current phase">
  <div className="home-photo-moon-disc" style={{backgroundImage:'url("'+image+'")'}} />
  {path&&<svg className="home-photo-moon-shadow" viewBox="0 0 200 200" preserveAspectRatio="none"><path d={path} fill="#050a13" fillOpacity=".82"/></svg>}
 </div>;
}
