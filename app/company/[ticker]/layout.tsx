import type {ReactNode} from "react";
import Sidebar from "@/components/Sidebar";
import CompanySwitcher from "@/components/CompanySwitcher";
export default async function CompanyLayout({children,params}:{children:ReactNode;params:Promise<{ticker:string}>}){
 const {ticker}=await params;const symbol=ticker.toUpperCase();
 return <><div className="pagebar"><CompanySwitcher key={symbol} ticker={symbol}/></div><div className="body"><Sidebar ticker={symbol}/><section className="content">{children}</section></div></>;
}
