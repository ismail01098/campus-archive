import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Search, Upload, LayoutDashboard } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Archive | Academic Question Papers",
  description: "A searchable academic question paper archive for your college."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const college = process.env.NEXT_PUBLIC_COLLEGE_NAME || "Your College";
  return <html lang="en"><body>
    <header style={{background:"white",borderBottom:"1px solid var(--line)"}}>
      <div className="container" style={{height:72,display:"flex",alignItems:"center",justifyContent:"space-between",gap:18}}>
        <Link href="/" style={{display:"flex",alignItems:"center",gap:11,fontWeight:800}}>
          <span style={{width:38,height:38,background:"#243f9f",color:"white",borderRadius:11,display:"grid",placeItems:"center"}}><BookOpen size={20}/></span>
          <span style={{lineHeight:1.1}}>CAMPUS ARCHIVE<small style={{display:"block",fontSize:10,color:"#7b8498",fontWeight:600,letterSpacing:".08em",marginTop:4}}>{college.toUpperCase()}</small></span>
        </Link>
        <nav style={{display:"flex",alignItems:"center",gap:18,fontSize:14,fontWeight:600}}>
          <Link href="/papers"><Search size={15} style={{display:"inline",verticalAlign:"-3px"}}/> Papers</Link>
          <Link href="/upload"><Upload size={15} style={{display:"inline",verticalAlign:"-3px"}}/> Upload</Link>
          <Link href="/dashboard"><LayoutDashboard size={15} style={{display:"inline",verticalAlign:"-3px"}}/> Dashboard</Link>
          <Link className="btn btn-primary" href="/login" style={{padding:"9px 14px"}}>Sign in</Link>
        </nav>
      </div>
    </header>
    {children}
    <footer style={{marginTop:72,padding:"28px 0",borderTop:"1px solid var(--line)",background:"white"}}>
      <div className="container" style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",fontSize:13,color:"#7b8498"}}>
        <span>© {new Date().getFullYear()} Campus Archive · Built for students</span><span>Academic resources, organized.</span>
      </div>
    </footer>
  </body></html>;
}
