import {getSubmissions,filingUrl} from "@/lib/sec";
import FilingsTable from "@/components/FilingsTable";
export default async function FilingsView({cik}:{cik:string}){
 const subs=await getSubmissions(cik);const r=subs.filings.recent;
 const rows=r.accessionNumber.map((a:string,i:number)=>({accn:a,form:r.form[i],date:r.filingDate[i],doc:r.primaryDocument[i],desc:r.primaryDocDescription[i],url:filingUrl(cik,a,r.primaryDocument[i])}));
 return <FilingsTable rows={rows}/>;
}
