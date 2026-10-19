import {getFundamentals} from "@/lib/data";
import {money} from "@/lib/format";
export default async function SnapshotFundamentals({cik,price}:{cik:string;price:number|null}){
 const fund=await getFundamentals(cik).catch(()=>null);
 const cap=price!==null&&fund?.sharesOutstanding?price*fund.sharesOutstanding:null;
 return <dl className="stats"><div><dt>Market Cap</dt><dd>{cap!==null?money(cap):"N/A"}</dd></div><div><dt>Shares Outstanding</dt><dd>{fund?.sharesOutstanding?fund.sharesOutstanding.toLocaleString("en-US"):"N/A"}</dd></div><div><dt>Annual Revenue</dt><dd>{fund?.revenue?money(fund.revenue.value):"N/A"}</dd></div></dl>;
}
