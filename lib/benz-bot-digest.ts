// No-cost editorial-style digest based solely on the supplied news feed.
// Headlines are not full articles. Avoid inventing details or claiming causality.
type Headline={title:string;source?:string;published?:string;url?:string};
const clean=(s:string)=>s.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();
const norm=(s:string)=>clean(s.toLowerCase().replace(/[^a-z0-9 ]/g,"")).slice(0,110);
const title=(s:string)=>clean(s.replace(/\s+[-–|]\s+(Reuters|CNBC|Bloomberg|Yahoo Finance|WSJ|Financial Times|AP News|The Wall Street Journal)$/i,"")).replace(/[.!?:;]+$/,"");
const themes=[
 {label:"economic data and interest rates",pattern:/fed|interest rate|treasur|bond yield|inflation|cpi|ppi|jobs|employment|payroll|gdp|econom|recession|consumer|retail sales|central bank/i},
 {label:"equity-market trading",pattern:/s&p|nasdaq|dow jones|wall street|stock market|stocks|equities|shares|futures|index|rally|selloff|market/i},
 {label:"corporate earnings and business developments",pattern:/earnings|profit|revenue|quarter|guidance|forecast|ceo|merger|acqui|ipo|buyback|dividend|company|companies/i},
 {label:"technology and artificial intelligence",pattern:/artificial intelligence|\bai\b|chip|nvidia|microsoft|apple|google|amazon|tesla|semiconductor|technology|software|data center/i},
 {label:"global trade and commodities",pattern:/tariff|trade|china|europe|oil|crude|gold|commodity|opec|dollar|currency|geopolit|war/i}
];
function select(stories:Headline[]){
 const seen=new Set<string>();
 return stories.map(s=>title(s.title||"")).filter(t=>{const key=norm(t);if(!key||seen.has(key)||t.length<12)return false;seen.add(key);return true});
}
function joinHeadlines(items:string[]){
 if(items.length===1)return items[0];
 if(items.length===2)return items[0]+" and "+items[1];
 return items.slice(0,-1).join("; ")+"; and "+items[items.length-1];
}
export function freeMarketDigest(stories:Headline[]):string{
 const items=select(stories);
 if(!items.length)return "";
 const buckets=new Map<string,string[]>();
 const others:string[]=[];
 for(const headline of items.slice(0,35)){
  const match=themes.find(t=>t.pattern.test(headline));
  if(!match){others.push(headline);continue}
  const group=buckets.get(match.label)||[];
  if(group.length<2)group.push(headline);
  buckets.set(match.label,group);
 }
 const sections=[...buckets.entries()].filter(([,arr])=>arr.length).slice(0,4);
 const intro="Today's market news spans "+(sections.length?sections.map(([key])=>key).join(", "):"several major developments")+".";
 const sentences=sections.map(([key,arr])=>"On "+key+", the latest reporting highlights "+joinHeadlines(arr.map(t=>t.charAt(0).toLowerCase()+t.slice(1)))+".");
 if(others.length&&sentences.length<4)sentences.push("Other notable coverage includes "+joinHeadlines(others.slice(0,2).map(t=>t.charAt(0).toLowerCase()+t.slice(1)))+".");
 return [intro,...sentences].join(" ").replace(/\.\./g,".");
}
