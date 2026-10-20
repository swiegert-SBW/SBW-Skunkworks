"use client";
import React from "react";

/**
 * Original vector lettering for SBW Research Terminal.
 * Wide, low-profile sci-fi geometry with restrained open terminals,
 * an open crossbar-free A, and a single intentional gap on E and R.
 * No third-party font outlines or font assets are used.
 */
const glyphs:Record<string,string[]>={
 A:["M3 44 L21 6 L39 44"],
 B:["M4 6 H26 C43 6 43 23 27 24 H4 V6","M4 24 H27 C44 24 44 44 27 44 H4"],
 C:["M39 9 Q33 6 27 6 H17 C8 6 4 12 4 21 V29 C4 38 8 44 17 44 H27 Q33 44 39 41"],
 E:["M39 6 H4 V44 H39","M4 25 H31"],
 H:["M4 6 V44","M39 6 V44","M4 25 H39"],
 I:["M8 6 H35","M21.5 6 V44","M8 44 H35"],
 L:["M4 6 V44 H39"],
 M:["M4 44 V6 L21.5 29 L39 6 V44"],
 N:["M4 44 V6 L39 44 V6"],
 R:["M4 44 V6 H25 C43 6 43 27 25 27 H11","M26 32 L39 44"],
 S:["M39 8 Q34 6 26 6 H17 C8 6 4 10 4 17 C4 23 9 25 17 25 H26 C35 25 39 29 39 36 C39 41 34 44 26 44 H16 Q9 44 4 42"],
 T:["M4 6 H39","M21.5 6 V44"],
 W:["M4 6 L11 44 L21.5 24 L32 44 L39 6"],
 " ":[]
};
const ADVANCE=55;
function WordLine({value}:{value:string}){
 const chars=value.toUpperCase().split("");
 const width=chars.reduce((sum,ch)=>sum+(ch===" "?26:ADVANCE),0);
 let offset=0;
 return <svg className="terminal-wordmark-line" viewBox={`0 0 ${width} 50`} role="img" aria-label={value} preserveAspectRatio="xMidYMid meet">
  <g fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="butt" strokeLinejoin="round">
   {chars.map((ch,i)=>{const x=offset;offset+=ch===" "?26:ADVANCE;return <g key={i} transform={`translate(${x+5},0)`}>{(glyphs[ch]||[]).map((d,j)=><path key={j} d={d}/>)}</g>})}
  </g>
 </svg>;
}
export default function TerminalWordmark({landing=false}:{landing?:boolean}){
 return <span className={landing?"terminal-wordmark terminal-wordmark-home":"terminal-wordmark terminal-wordmark-header"} aria-label="SBW Research Terminal">
  {landing?<><WordLine value="SBW"/><WordLine value="RESEARCH"/><WordLine value="TERMINAL"/></>:<WordLine value="SBW RESEARCH TERMINAL"/>}
 </span>;
}
