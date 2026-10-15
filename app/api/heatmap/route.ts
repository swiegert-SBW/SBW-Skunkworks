import {NextRequest,NextResponse} from "next/server";
const SP="NVDA MSFT AAPL AMZN GOOGL META AVGO BRK-B LLY JPM TSLA WMT V XOM MA COST ORCL JNJ HD PG NFLX ABBV BAC CRM CVX KO AMD MRK WFC CSCO ACN PEP LIN ADBE MCD TMO IBM GE QCOM TXN INTU CAT AMGN DIS PM VZ NOW UBER ISRG SPGI AXP RTX T BKNG NEE PFE LOW HON UNH COP GS DE BLK PLTR PANW ANET MU KLAC SNPS CDNS CRWD SHOP ADP MDT SYK GILD VRTX TJX NKE F GM UPS NEM FCX EOG SLB DUK SO PLD AMT EQIX C COIN ABNB DASH DELL APH CEG APP ARM";
const NAS="NVDA MSFT AAPL AMZN GOOGL META AVGO TSLA COST NFLX AMD PEP CSCO ADBE QCOM TXN INTU AMGN ISRG BKNG INTC AMAT MU LRCX KLAC SNPS CDNS PANW CRWD PLTR ADP SBUX GILD VRTX REGN MDLZ ADI MELI ORLY CTAS MAR ABNB DASH FTNT MRVL WDAY TEAM DDOG ZS MDB SHOP PYPL PDD ARM APP COIN HOOD CEG LIN HON CMCSA TMUS VRSK PAYX CPRT FAST PCAR ROST ODFL EA TTD IDXX DXCM EXC XEL KDP CSX ON MCHP NXPI ANSS ILMN BIIB MRNA ALNY GEHC TTWO LULU AEP BKR AZN GFS";
const DOW="AAPL AMGN AMZN AXP BA CAT CRM CSCO CVX DIS GS HD HON IBM JNJ JPM KO MCD MMM MRK MSFT NKE NVDA PG SHW TRV UNH V VZ WMT";
const RUS="SMCI IONQ RKLB HIMS SOFI ASTS CELH CAVA DUOL RBLX HOOD APP COIN AFRM UPST CVNA GME CHWY BILL PATH DOCU U CFLT IOT SOUN TEM ALAB CRDO VRT CLS CIEN FIVE ELF INSM EXAS VKTX ACHR JOBY LUNR IRDM AAOI TMDX AXON MOD POWL TOST GTLB ESTC DT BRZE KVYO APPF FOUR PAYO NU IBKR ENPH RUN ARRY FSLR RIVN LCID CHPT OPEN CIFR CLSK MARA RIOT SMR OKLO CCJ MP CRSP BEAM EDIT NTLA BMRN PCVX CYTK AXSM MDGL BROS YETI CROX DECK ETSY EBAY WIX PINS SNAP DKNG RCL CCL DAL UAL XPO SAIA GXO PCOR CARG ROOT OSCR DOCS GH ACAD RARE IONS NBIX HALO TNDM PAYC GDDY AKAM CYBR TENB KVUE COTY HRL VFC GPS LEVI ONON POOL TREX BLDR GNRC BWXT KTOS AVAV LDOS CACI TTEK OXY MPC VLO FLUT MGM AAL WM RSG SMAR VRNS QLYS BMBL MTCH EXPE TCOM SQ LMND PTON BABA JD PDD LI XPEV NIO YUMC BILI FUTU TIGR ALGN PODD NVCR MEDP INSP IEX WTS VICR VECO RMBS DOCN YELP TRIP RDFN ACVA KMX LAD THO MBLY LAZR OUST QS PLUG BE AMRC NRG VST AMH CUBE EXR O VICI CCI IRM WPC STAG DKS ASO OLED COHR LITE NUE STLD ATI DVN TPR RL ANF URBN";
const INFO:Record<string,[string,string,number]>={NVDA:["NVIDIA","Technology",4.5e12],MSFT:["Microsoft","Technology",3.8e12],AAPL:["Apple","Technology",3.4e12],AMZN:["Amazon","Consumer Cyclical",2.5e12],GOOGL:["Alphabet","Communication Services",2.4e12],META:["Meta Platforms","Communication Services",1.9e12],AVGO:["Broadcom","Technology",1.4e12],["BRK-B"]:["Berkshire Hathaway","Financial",1.1e12],LLY:["Eli Lilly","Healthcare",8e11],JPM:["JPMorgan Chase","Financial",8e11],TSLA:["Tesla","Consumer Cyclical",1e12],WMT:["Walmart","Consumer Defensive",8e11],V:["Visa","Financial",7e11],MA:["Mastercard","Financial",5e11],COST:["Costco","Consumer Defensive",4e11],ORCL:["Oracle","Technology",5e11],PLTR:["Palantir","Technology",3e11],CDNS:["Cadence Design Systems","Technology",1e11],SNPS:["Synopsys","Technology",1e11],DUOL:["Duolingo","Technology",1.2e10],HOOD:["Robinhood Markets","Financial",7e10],SOFI:["SoFi Technologies","Financial",1.5e10],IONQ:["IonQ","Technology",1e10],RKLB:["Rocket Lab","Industrials",1.5e10],HIMS:["Hims & Hers Health","Healthcare",1e10],APP:["AppLovin","Technology",1.2e11],COIN:["Coinbase","Financial",5e10],AFRM:["Affirm","Financial",2e10],CVNA:["Carvana","Consumer Cyclical",5e10],CAVA:["Cava Group","Consumer Cyclical",1e10],TEM:["Tempus AI","Healthcare",1e10],SOUN:["SoundHound AI","Technology",5e9],RIVN:["Rivian","Consumer Cyclical",1e10],FSLR:["First Solar","Technology",2e10],SMR:["NuScale Power","Industrials",5e9],AXON:["Axon Enterprise","Industrials",5e10],TOST:["Toast","Technology",2e10],GTLB:["GitLab","Technology",1e10],BABA:["Alibaba","Consumer Cyclical",2e11],NIO:["NIO","Consumer Cyclical",1e10]};

type Constituent={ticker:string;sector:string;name?:string};
const GICS=["Communication Services","Consumer Discretionary","Consumer Staples","Energy","Financials","Health Care","Industrials","Information Technology","Materials","Real Estate","Utilities"];
function normalizeSector(value:string):string {
 const v=value.trim().replace(/&amp;/g,"&");
 const aliases:Record<string,string>={"Technology":"Information Technology","Information Tech":"Information Technology","Consumer Cyclical":"Consumer Discretionary","Consumer Defensive":"Consumer Staples","Healthcare":"Health Care","Financial":"Financials","Financial Services":"Financials","Basic Materials":"Materials","Telecommunication Services":"Communication Services","Communications":"Communication Services","Telecommunications":"Communication Services"};
 return aliases[v]|| (GICS.includes(v)?v:"");
}
function cleanCell(cell:string):string{return cell.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#160;|&nbsp;/g," ").replace(/\s+/g," ").trim();}
function csvFields(line:string):string[]{const out:string[]=[];let value="",quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===","&&!quoted){out.push(value);value="";}else value+=c;}out.push(value);return out;}
async function getConstituents(index:string):Promise<Constituent[]>{
 const headers={"User-Agent":"Mozilla/5.0 (compatible; SBWWorkstation/1.0)"};
 if(index==="sp500"||index==="nasdaq100"){
  const url=index==="sp500"?"https://en.wikipedia.org/wiki/List_of_S%26P_500_companies":"https://en.wikipedia.org/wiki/List_of_NASDAQ-100_companies";
  const res=await fetch(url,{headers,cache:"no-store"});
  if(!res.ok)throw Error("Index constituent source unavailable");
  const html=await res.text();
  const tables=[...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)].map(m=>m[0]);
  const table=index==="sp500"?tables.find(t=>/id=["']constituents["']/.test(t))||tables[0]:tables.find(t=>/GICS Sector|GICS sector|Industry/.test(t))||tables[0];
  if(!table)throw Error("Constituent table missing");
  const rows=[...table.matchAll(/<tr\b[\s\S]*?<\/tr>/gi)].map(m=>m[0]);
  const headerCells=[...(rows[0]||"").matchAll(/<th\b[^>]*>[\s\S]*?<\/th>/gi)].map(m=>cleanCell(m[0]).toLowerCase());
  const sectorColumn=headerCells.findIndex(h=>h.includes("gics sector")||h==="sector"||h==="gics"||(index==="nasdaq100"&&h.includes("icb industry")));
  const tickerColumn=headerCells.findIndex(h=>h.includes("symbol")||h==="ticker");
  const nameColumn=headerCells.findIndex(h=>h==="security"||h==="company"||h==="name");
  if(sectorColumn<0)throw Error("Index source does not contain GICS sectors");
  const result:Constituent[]=[];
  for(const row of rows.slice(1)){
   const cells=[...row.matchAll(/<td\b[^>]*>[\s\S]*?<\/td>/gi)].map(m=>m[0]);
   if(cells.length<=sectorColumn)continue;
   const ticker=cleanCell(cells[tickerColumn<0?0:tickerColumn]).split(/\s+/)[0].replace(/\./g,"-");
   const sector=normalizeSector(cleanCell(cells[sectorColumn]));
   if(/^[A-Z][A-Z0-9-]{0,9}$/.test(ticker)&&sector)result.push({ticker,sector,name:nameColumn>=0?cleanCell(cells[nameColumn]):undefined});
  }
  return Array.from(new Map(result.map(c=>[c.ticker,c])).values());
 }
 if(index==="russell2000"){
  const res=await fetch("https://www.ishares.com/us/products/239710/ishares-russell-2000-etf/1467271812596.ajax?fileType=csv&fileName=IWM_holdings&dataType=fund",{headers,cache:"no-store"});
  if(!res.ok)throw Error("Russell constituent source unavailable");
  const lines=(await res.text()).split(/\r?\n/);
  const start=lines.findIndex(line=>/^\s*"?Ticker"?,/i.test(line));
  if(start<0)throw Error("Russell holdings format changed");
  const header=csvFields(lines[start]).map(v=>v.trim().toLowerCase());
  const tickerCol=header.indexOf("ticker"),sectorCol=header.indexOf("sector"),nameCol=header.indexOf("name");
  if(tickerCol<0||sectorCol<0)throw Error("Russell sector data unavailable");
  const result:Constituent[]=[];
  for(const line of lines.slice(start+1)){
   const cells=csvFields(line),ticker=(cells[tickerCol]||"").trim().replace(/\./g,"-"),sector=normalizeSector(cells[sectorCol]||"");
   if(/^[A-Z][A-Z0-9-]{0,9}$/.test(ticker)&&sector)result.push({ticker,sector,name:cells[nameCol]});
  }
  return Array.from(new Map(result.map(c=>[c.ticker,c])).values());
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
 const sectorsByTicker=new Map<string,Constituent>();
 if(["sp500","nasdaq100","russell2000"].includes(index)){
  try {
   const live=await getConstituents(index);
   const minimum=index==="russell2000"?1500:index==="sp500"?490:95;
   if(live.length<minimum)throw Error("Constituent source returned too few symbols");
   tickers=live.map(c=>c.ticker);\n   for(const c of live)sectorsByTicker.set(c.ticker,c);
  }catch{
   return NextResponse.json({error:"Could not load the complete index constituent list. Please retry later; an incomplete fallback would be misleading."},{status:503});
  }
 }
 if(index==="watchlist"){
  tickers=(p.get("tickers")||"").split(",").map(t=>t.trim().toUpperCase().replace(/\./g,"-")).filter(t=>/^[A-Z0-9^=-]{1,12}$/.test(t)).slice(0,300);
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
  const q=quoteMap[ticker],info=INFO[ticker],constituent=sectorsByTicker.get(ticker);
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
  const rawSector=String(constituent?.sector||q?.sector||info?.[1]||"Other");
  const sector=sectorMap[rawSector]||rawSector;
  const knownSectors=["Communication Services","Consumer Discretionary","Consumer Staples","Energy","Financials","Health Care","Industrials","Information Technology","Materials","Real Estate","Utilities"];
  return {ticker,name:constituent?.name||q?.shortName||q?.longName||info?.[0]||d?.meta?.longName||d?.meta?.shortName||ticker,sector:knownSectors.includes(sector)?sector:"Other",marketCap:Number(q?.marketCap)||info?.[2]||1,change:hasQuote?(price/base-1)*100:0,price:hasQuote?price:null,quoteAvailable:hasQuote};
 }));
 return NextResponse.json({tiles,total,offset,updatedAt:new Date().toISOString(),note:sourceNote,missingQuotes:tiles.filter(t=>!t.quoteAvailable).length},{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=1800"}});
}
