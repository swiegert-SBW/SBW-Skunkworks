// Free, extractive market briefing. No LLM, API key, or third-party scraping.
// Every statement is a supplied headline; do not imply analysis of article bodies.
type Headline={title:string;source?:string;published?:string;url?:string};
const clean=(s:string)=>s.replace(/\s+/g," ").trim();
const norm=(s:string)=>clean(s.toLowerCase().replace(/[^a-z0-9 ]/g,"")).slice(0,110);
export function freeMarketDigest(stories:Headline[]){
 const seen=new Set<string>();const items:Headline[]=[];
 for(const s of stories){const title=clean(s.title||"");const key=norm(title);if(!key||seen.has(key))continue;seen.add(key);items.push({...s,title});if(items.length>=5)break}
 return items;
}
