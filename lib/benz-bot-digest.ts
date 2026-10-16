// Free, deterministic headline-based digest. No AI service or API credits.
// Summarizes only what the headlines explicitly say; does not invent article details.
type Headline={title:string;source?:string;published?:string;url?:string};
const clean=(s:string)=>s.replace(/\s+/g," ").trim();
const norm=(s:string)=>clean(s.toLowerCase().replace(/[^a-z0-9 ]/g,"")).slice(0,110);
const trimTitle=(title:string)=>clean(title.replace(/\s+[-–|]\s+(Reuters|CNBC|Bloomberg|Yahoo Finance|WSJ|Financial Times|AP News|The Wall Street Journal)$/i,"")).replace(/[.!?]+$/,"");
export function freeMarketDigest(stories:Headline[]):string{
 const seen=new Set<string>();const items:string[]=[];
 for(const s of stories){const title=trimTitle(s.title||"");const key=norm(title);if(!key||seen.has(key))continue;seen.add(key);items.push(title);if(items.length>=4)break}
 if(!items.length)return "";
 const clauses=items.map((t,i)=>{const phrase=t.charAt(0).toLowerCase()+t.slice(1);return i===0?"Today's market coverage highlights "+phrase:i===1?"Other headlines focus on "+phrase:i===2?"Reports also cover "+phrase:"Additional coverage includes "+phrase});
 return clauses.map(s=>/[.!?]$/.test(s)?s:s+".").join(" ");
}
