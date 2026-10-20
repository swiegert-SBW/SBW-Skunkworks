"use client";
import React from "react";
/** Custom outlined, space-age wordmark. SVG paths ensure the disconnected E/R and open A render consistently on every device. */
const glyphs:Record<string,string[]>={
 A:["M3 45 L21 3 L39 45"],B:["M3 3 L3 45","M3 3 H26 Q39 3 39 14 Q39 24 26 24 H10","M10 24 H26 Q40 24 40 35 Q40 45 26 45 H3"],
 C:["M39 7 Q33 3 26 3 H16 Q3 3 3 16 V32 Q3 45 16 45 H26 Q33 45 39 41"],
 E:["M3 3 H39","M3 45 H39","M3 23 H31","M3 9 V18","M3 29 V39"],
 H:["M3 3 V45","M39 3 V45","M3 24 H39"],
 I:["M8 3 H34","M21 3 V45","M8 45 H34"],
 L:["M3 3 V45 H39"],
 M:["M3 45 V3 L21 27 L39 3 V45"],
 N:["M3 45 V3 L39 45 V3"],
 R:["M3 3 V45","M10 3 H25 Q39 3 39 15 Q39 26 25 26 H10","M25 30 L39 45"],
 S:["M39 6 Q32 3 25 3 H16 Q3 3 3 15 Q3 24 16 24 H26 Q39 24 39 34 Q39 45 26 45 H15 Q8 45 3 42"],
 T:["M3 3 H39","M21 3 V45"],
 W:["M3 3 L10 45 L21 22 L32 45 L39 3"],
 " ":[]
};
function WordLine({value}:{value:string}){const chars=value.toUpperCase().split("");const width=chars.reduce((n,c)=>n+(c===" "?27:55),0);let offset=0;return <svg className="terminal-wordmark-line" viewBox={`0 0 ${width} 52`} role="img" aria-label={value} preserveAspectRatio="xMidYMid meet"><g fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="square" strokeLinejoin="round">{chars.map((c,i)=>{const x=offset;offset+=c===" "?27:55;return <g key={i} transform={`translate(${x+5},0)`}>{(glyphs[c]||[]).map((d,j)=><path key={j} d={d}/>)}</g>})}</g></svg>}
export default function TerminalWordmark({landing=false}:{landing?:boolean}){return <span className={landing?"terminal-wordmark terminal-wordmark-home":"terminal-wordmark terminal-wordmark-header"} aria-label="SBW Research Terminal">{landing?<><WordLine value="SBW"/><WordLine value="RESEARCH"/><WordLine value="TERMINAL"/></>:<WordLine value="SBW RESEARCH TERMINAL"/>}</span>}
