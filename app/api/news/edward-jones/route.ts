import {NextResponse} from "next/server";
export const runtime="nodejs";
const source="https://www.edwardjones.com/us-en/market-news-insights/stock-market-news/daily-market-recap";
const decode=(s:string)=>s.replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&rsquo;|&#8217;/gi,"’").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\s+/g," ").trim();
const strip=(s:string)=>decode(s.replace(/<[^>]+>/g," "));
const categories=[
 ["equity-market performance",/stocks|equities|s&p|nasdaq|dow|market|index|indices/i],
 ["the economy and Federal Reserve policy",/econom|fed|inflation|interest rate|jobs|labor|gdp|consumer|treasury/i],
 ["corporate earnings and outlooks",/earnings|profit|revenue|guidance|corporat|quarter/i],
 ["global developments",/global|international|trade|tariff|china|europe|oil|geopolit/i],
 ["bonds and interest rates",/bond|yield|fixed income|treasur|rate/i]
] as const;
export async function GET(){
 try{
  const response=await fetch(source,{headers:{"Accept":"text/html","User-Agent":"Mozilla/5.0"},next:{revalidate:3600},signal:AbortSignal.timeout(12000)});
  if(!response.ok)return NextResponse.json({error:"Recap source unavailable"},{status:502});
  const html=await response.text();
  const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html;
  const text=strip(main.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," "));
  if(!/market recap|market update|market news/i.test(text))return NextResponse.json({error:"Recap could not be identified"},{status:502});
  const headings=[...main.matchAll(/<h[2-4]\b[^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map(m=>strip(m[1])).filter(s=>s.length>15&&s.length<140&&!/subscribe|related|insight|contact|advisor|explore|share/i.test(s)).slice(0,12);
  const matched=categories.filter(([,re])=>headings.some(h=>re.test(h))).map(([name])=>name);
  if(!matched.length)return NextResponse.json({error:"No current recap sections found"},{status:502});
  const summary="The latest Edward Jones daily market recap covers "+matched.slice(0,4).join(", ")+". Its analysis discusses the day's developments and what they may mean for investors. Read the full Edward Jones commentary for the underlying figures, market drivers, and context.";
  return NextResponse.json({summary,url:source},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=3600"}});
 }catch{return NextResponse.json({error:"Recap retrieval failed"},{status:502})}
}
