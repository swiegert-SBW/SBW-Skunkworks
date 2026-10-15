import marketCaps from "../../../data/market-caps.json";
import {NextRequest,NextResponse} from "next/server";
const SP="NVDA MSFT AAPL AMZN GOOGL META AVGO BRK-B LLY JPM TSLA WMT V XOM MA COST ORCL JNJ HD PG NFLX ABBV BAC CRM CVX KO AMD MRK WFC CSCO ACN PEP LIN ADBE MCD TMO IBM GE QCOM TXN INTU CAT AMGN DIS PM VZ NOW UBER ISRG SPGI AXP RTX T BKNG NEE PFE LOW HON UNH COP GS DE BLK PLTR PANW ANET MU KLAC SNPS CDNS CRWD SHOP ADP MDT SYK GILD VRTX TJX NKE F GM UPS NEM FCX EOG SLB DUK SO PLD AMT EQIX C COIN ABNB DASH DELL APH CEG APP ARM";
const NAS="NVDA MSFT AAPL AMZN GOOGL META AVGO TSLA COST NFLX AMD PEP CSCO ADBE QCOM TXN INTU AMGN ISRG BKNG INTC AMAT MU LRCX KLAC SNPS CDNS PANW CRWD PLTR ADP SBUX GILD VRTX REGN MDLZ ADI MELI ORLY CTAS MAR ABNB DASH FTNT MRVL WDAY TEAM DDOG ZS MDB SHOP PYPL PDD ARM APP COIN HOOD CEG LIN HON CMCSA TMUS VRSK PAYX CPRT FAST PCAR ROST ODFL EA TTD IDXX DXCM EXC XEL KDP CSX ON MCHP NXPI ANSS ILMN BIIB MRNA ALNY GEHC TTWO LULU AEP BKR AZN GFS";
const DOW="AAPL AMGN AMZN AXP BA CAT CRM CSCO CVX DIS GS HD HON IBM JNJ JPM KO MCD MMM MRK MSFT NKE NVDA PG SHW TRV UNH V VZ WMT";
const RUS="SMCI IONQ RKLB HIMS SOFI ASTS CELH CAVA DUOL RBLX HOOD APP COIN AFRM UPST CVNA GME CHWY BILL PATH DOCU U CFLT IOT SOUN TEM ALAB CRDO VRT CLS CIEN FIVE ELF INSM EXAS VKTX ACHR JOBY LUNR IRDM AAOI TMDX AXON MOD POWL TOST GTLB ESTC DT BRZE KVYO APPF FOUR PAYO NU IBKR ENPH RUN ARRY FSLR RIVN LCID CHPT OPEN CIFR CLSK MARA RIOT SMR OKLO CCJ MP CRSP BEAM EDIT NTLA BMRN PCVX CYTK AXSM MDGL BROS YETI CROX DECK ETSY EBAY WIX PINS SNAP DKNG RCL CCL DAL UAL XPO SAIA GXO PCOR CARG ROOT OSCR DOCS GH ACAD RARE IONS NBIX HALO TNDM PAYC GDDY AKAM CYBR TENB KVUE COTY HRL VFC GPS LEVI ONON POOL TREX BLDR GNRC BWXT KTOS AVAV LDOS CACI TTEK OXY MPC VLO FLUT MGM AAL WM RSG SMAR VRNS QLYS BMBL MTCH EXPE TCOM SQ LMND PTON BABA JD PDD LI XPEV NIO YUMC BILI FUTU TIGR ALGN PODD NVCR MEDP INSP IEX WTS VICR VECO RMBS DOCN YELP TRIP RDFN ACVA KMX LAD THO MBLY LAZR OUST QS PLUG BE AMRC NRG VST AMH CUBE EXR O VICI CCI IRM WPC STAG DKS ASO OLED COHR LITE NUE STLD ATI DVN TPR RL ANF URBN";
const INFO:Record<string,[string,string,number]>={NVDA:["NVIDIA","Technology",4.5e12],MSFT:["Microsoft","Technology",3.8e12],AAPL:["Apple","Technology",3.4e12],AMZN:["Amazon","Consumer Cyclical",2.5e12],GOOGL:["Alphabet","Communication Services",2.4e12],META:["Meta Platforms","Communication Services",1.9e12],AVGO:["Broadcom","Technology",1.4e12],["BRK-B"]:["Berkshire Hathaway","Financial",1.1e12],LLY:["Eli Lilly","Healthcare",8e11],JPM:["JPMorgan Chase","Financial",8e11],TSLA:["Tesla","Consumer Cyclical",1e12],WMT:["Walmart","Consumer Defensive",8e11],V:["Visa","Financial",7e11],MA:["Mastercard","Financial",5e11],COST:["Costco","Consumer Defensive",4e11],ORCL:["Oracle","Technology",5e11],PLTR:["Palantir","Technology",3e11],CDNS:["Cadence Design Systems","Technology",1e11],SNPS:["Synopsys","Technology",1e11],DUOL:["Duolingo","Technology",1.2e10],HOOD:["Robinhood Markets","Financial",7e10],SOFI:["SoFi Technologies","Financial",1.5e10],IONQ:["IonQ","Technology",1e10],RKLB:["Rocket Lab","Industrials",1.5e10],HIMS:["Hims & Hers Health","Healthcare",1e10],APP:["AppLovin","Technology",1.2e11],COIN:["Coinbase","Financial",5e10],AFRM:["Affirm","Financial",2e10],CVNA:["Carvana","Consumer Cyclical",5e10],CAVA:["Cava Group","Consumer Cyclical",1e10],TEM:["Tempus AI","Healthcare",1e10],SOUN:["SoundHound AI","Technology",5e9],RIVN:["Rivian","Consumer Cyclical",1e10],FSLR:["First Solar","Technology",2e10],SMR:["NuScale Power","Industrials",5e9],AXON:["Axon Enterprise","Industrials",5e10],TOST:["Toast","Technology",2e10],GTLB:["GitLab","Technology",1e10],BABA:["Alibaba","Consumer Cyclical",2e11],NIO:["NIO","Consumer Cyclical",1e10]};

type Member={ticker:string;name:string;sector:string;industry:string};
const GICS=new Set(["Communication Services","Consumer Discretionary","Consumer Staples","Energy","Financials","Health Care","Industrials","Information Technology","Materials","Real Estate","Utilities"]);
function clean(v:string){return v.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#160;|&nbsp;/g," ").replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))).replace(/\[[^\]]*\]/g,"").replace(/\s+/g," ").trim();}
function csv(line:string){const result:string[]=[];let v="",quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){v+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){result.push(v);v="";}else v+=c;}result.push(v);return result;}
function normalize(v:string){const a:Record<string,string>={"Technology":"Information Technology","Consumer Cyclical":"Consumer Discretionary","Consumer Defensive":"Consumer Staples","Healthcare":"Health Care","Financial":"Financials","Financial Services":"Financials","Basic Materials":"Materials","Telecommunications":"Communication Services","Telecommunication Services":"Communication Services"};return a[v]||v;}
type Holding={weight:number;sector:string;name:string};
async function getIndexWeights(index:string):Promise<Map<string,Holding>>{
 const urls:Record<string,string>={
  sp500:"https://www.ishares.com/us/products/239726/ishares-core-sp-500-etf/1467271812596.ajax?fileType=csv&fileName=IVV_holdings&dataType=fund",
  russell2000:"https://www.ishares.com/us/products/239710/ishares-russell-2000-etf/1467271812596.ajax?fileType=csv&fileName=IWM_holdings&dataType=fund"
 };
 if(!urls[index])return new Map();
 try{
  const response=await fetch(urls[index],{headers:{"User-Agent":"Mozilla/5.0"},next:{revalidate:3600}});
  if(!response.ok)return new Map();
  const lines=(await response.text()).split(/\r?\n/);
  const start=lines.findIndex(line=>/^\s*"?Ticker"?,/i.test(line));
  if(start<0)return new Map();
  const columns=csv(lines[start]).map(x=>x.toLowerCase().trim());
  const ti=columns.indexOf("ticker"),wi=columns.indexOf("weight (%)"),si=columns.indexOf("sector"),ni=columns.indexOf("name"),ai=columns.indexOf("asset class");
  if(ti<0||wi<0)return new Map();
  const result=new Map<string,Holding>();
  for(const line of lines.slice(start+1)){
   const c=csv(line),ticker=(c[ti]||"").trim().replace(/\./g,"-"),weight=Number((c[wi]||"").replace(/,/g,""));
   if(!/^[A-Z][A-Z0-9-]{0,9}$/.test(ticker)||!(weight>0)||ai>=0&&c[ai]!=="Equity")continue;
   result.set(ticker,{weight,sector:normalize(c[si]||""),name:c[ni]||ticker});
  }
  return result.size>=400?result:new Map();
 }catch{return new Map();}
}
async function getConstituents(index:string):Promise<Member[]>{
 const headers={"User-Agent":"Mozilla/5.0 (compatible; SBWWorkstation/1.0)"};
 if(index==="sp500"||index==="nasdaq100"){
  const url=index==="sp500"?"https://en.wikipedia.org/wiki/List_of_S%26P_500_companies":"https://en.wikipedia.org/wiki/Nasdaq-100";
  const response=await fetch(url,{headers,next:{revalidate:3600}});
  if(!response.ok)throw Error("Index source unavailable");
  const html=await response.text();
  const tables=[...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map(x=>x[0]);
  let members:Member[]=[];
  for(const table of tables){
   const rows=[...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map(x=>x[0]);
   const headings=[...(rows[0]||"").matchAll(/<th\b[^>]*>[\s\S]*?<\/th>/gi)].map(x=>clean(x[0]).toLowerCase());
   const tickerCol=headings.findIndex(x=>x.includes("symbol")||x==="ticker");
   const sectorCol=headings.findIndex(x=>x.includes("gics sector")||x==="sector");
   const industryCol=headings.findIndex(x=>x.includes("gics sub-industry")||x.includes("gics subindustry")||x==="sub-industry");
   const nameCol=headings.findIndex(x=>x==="security"||x==="company");
   if(tickerCol<0||sectorCol<0)continue;
   const found:Member[]=[];
   for(const row of rows.slice(1)){
    const cells=[...row.matchAll(/<td\b[^>]*>[\s\S]*?<\/td>/gi)].map(x=>clean(x[0]));
    const ticker=(cells[tickerCol]||"").split(/\s+/)[0].replace(/\./g,"-");
    const sector=normalize(cells[sectorCol]||"");
    if(/^[A-Z][A-Z0-9-]{0,9}$/.test(ticker)&&GICS.has(sector))found.push({ticker,sector,name:cells[nameCol]||ticker,industry:cells[industryCol]||"Other industry"});
   }
   if(found.length>members.length)members=found;
  }
  return [...new Map(members.map(x=>[x.ticker,x])).values()];
 }
 if(index==="russell2000"){
  const response=await fetch("https://www.ishares.com/us/products/239710/ishares-russell-2000-etf/1467271812596.ajax?fileType=csv&fileName=IWM_holdings&dataType=fund",{headers,next:{revalidate:3600}});
  if(!response.ok)throw Error("Holdings source unavailable");
  const lines=(await response.text()).split(/\r?\n/),start=lines.findIndex(x=>/^\s*"?Ticker"?,/i.test(x));
  if(start<0)throw Error("Holdings format changed");
  const headings=csv(lines[start]).map(x=>x.toLowerCase().trim()),tickerCol=headings.indexOf("ticker"),sectorCol=headings.indexOf("sector"),nameCol=headings.indexOf("name");
  if(tickerCol<0||sectorCol<0)throw Error("Holdings sector column missing");
  const members:Member[]=[];
  for(const line of lines.slice(start+1)){const c=csv(line),ticker=(c[tickerCol]||"").replace(/\./g,"-").trim(),sector=normalize((c[sectorCol]||"").trim());if(/^[A-Z][A-Z0-9-]{0,9}$/.test(ticker)&&GICS.has(sector))members.push({ticker,name:c[nameCol]||ticker,sector,industry:"Other industry"});}
  return [...new Map(members.map(x=>[x.ticker,x])).values()];
 }
 return [];
}


export async function GET(req: NextRequest) {
 const p=req.nextUrl.searchParams;
 const index=p.get("index")||"sp500";
 const period=["1d","5d","1mo","3mo","1y"].includes(p.get("period")||"")?p.get("period")!:"1d";
 const offset=Math.max(0,Number.parseInt(p.get("offset")||"0",10)||0);
 const limit=Math.min(25,Math.max(1,Number.parseInt(p.get("limit")||"25",10)||25));
 let tickers=(index==="nasdaq100"?NAS:index==="dow30"?DOW:index==="russell2000"?RUS:SP).split(" ");
 let sourceNote="";
 const members=new Map<string,Member>();
 const verifiedCaps:Record<string,number>=marketCaps.caps;
 const weights=new Map<string,Holding>();
 const totalWeight=[...weights.values()].reduce((sum,h)=>sum+h.weight,0);
 if(["sp500","nasdaq100","russell2000"].includes(index)){
  try {
   const live=await getConstituents(index);
   const minimum=index==="russell2000"?1500:index==="sp500"?490:95;
   if(live.length<minimum)throw Error("Constituent source returned too few symbols");
   tickers=live.map(x=>x.ticker);
   live.forEach(x=>members.set(x.ticker,x));
  }catch{
   return NextResponse.json({error:"Could not load the complete index constituent list. Please retry later; an incomplete fallback would be misleading."},{status:503});
  }
 }
 if(index==="watchlist"){
  tickers=(p.get("tickers")||"").split(",").map(t=>t.trim().toUpperCase().replace(/\\./g,"-")).filter(t=>/^[A-Z0-9^=-]{1,12}$/.test(t)).slice(0,300);
  if(!tickers.length)return NextResponse.json({tiles:[],total:0,updatedAt:new Date().toISOString(),note:"Add stocks to this watchlist first."});
 }
 tickers=Array.from(new Set(tickers));
 const total=tickers.length;
 const page=tickers.slice(offset,offset+limit);
 const quoteMap:Record<string,any>={};
 // Yahoo's bulk quote endpoint may be blocked. Always retain every constituent,
 // and fall back to individual chart quotes when bulk data is unavailable.
 try{
  const qr=await fetch("https://query1.finance.yahoo.com/v7/finance/quote?symbols="+page.map(encodeURIComponent).join(","),{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(6000),cache:"no-store"});
  if(qr.ok){const qj=await qr.json();for(const q of qj?.quoteResponse?.result||[])quoteMap[q.symbol]=q;}
 }catch{}
 const tiles=await Promise.all(page.map(async ticker=>{
  const q=quoteMap[ticker],info=INFO[ticker],member=members.get(ticker),holding=weights.get(ticker);
  let d:any=null;
  try {
   // Chart endpoint supplies a quote even when the bulk endpoint returns nothing.
   const r=await fetch("https://query1.finance.yahoo.com/v8/finance/chart/"+encodeURIComponent(ticker)+"?range="+(period==="1d"?"5d":period)+"&interval=1d",{headers:{"User-Agent":"Mozilla/5.0"},signal:AbortSignal.timeout(8000),cache:"no-store"});
   if(r.ok)d=(await r.json())?.chart?.result?.[0];
  }catch{}
  const price=Number(q?.regularMarketPrice??d?.meta?.regularMarketPrice);
  const prev=Number(q?.regularMarketPreviousClose??d?.meta?.chartPreviousClose??d?.meta?.previousClose);
  const closes=(d?.indicators?.quote?.[0]?.close||[]).filter((v:any)=>typeof v==="number"&&Number.isFinite(v));
  const base=period==="1d"?(prev||price):(closes[0]||price);
  const hasQuote=Number.isFinite(price)&&price>0&&Number.isFinite(base)&&base>0;
  const sectorMap:Record<string,string>={"Technology":"Information Technology","Consumer Cyclical":"Consumer Discretionary","Consumer Defensive":"Consumer Staples","Healthcare":"Health Care","Financial":"Financials","Basic Materials":"Materials","Financial Services":"Financials"};
  const rawSector=String(member?.sector||q?.sector||info?.[1]||"Other");
  const sector=sectorMap[rawSector]||rawSector;
  const knownSectors=["Communication Services","Consumer Discretionary","Consumer Staples","Energy","Financials","Health Care","Industrials","Information Technology","Materials","Real Estate","Utilities"];
  return {ticker,name:member?.name||q?.shortName||q?.longName||info?.[0]||d?.meta?.longName||d?.meta?.shortName||ticker,industry:member?.industry||"Other industry",sector:knownSectors.includes(sector)?sector:"Other",marketCap:verifiedCaps[ticker]||0,marketCapEstimated:false,sizeBasis:verifiedCaps[ticker]?"yfinance market cap":"Missing market cap",change:hasQuote?(price/base-1)*100:0,price:hasQuote?price:null,quoteAvailable:hasQuote};
 }));
 return NextResponse.json({tiles,total,offset,updatedAt:new Date().toISOString(),note:sourceNote,sizeBasis:"yfinance market cap",marketCapUpdatedAt:marketCaps.updatedAt,missingMarketCaps:tiles.filter(t=>!t.marketCap).length,missingQuotes:tiles.filter(t=>!t.quoteAvailable).length},{headers:{"Cache-Control":"private, no-store, max-age=0"}});
}
