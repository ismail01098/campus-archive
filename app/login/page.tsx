import Link from "next/link"; import { loginAction } from "@/app/auth-actions";
export default async function Login({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}) {
 const p=await searchParams;
 return <main className="container" style={{maxWidth:480,paddingTop:58}}><div className="panel" style={{padding:30}}><p className="tag">WELCOME BACK</p><h1 style={{fontSize:30}}>Sign in</h1><p className="muted">Access your student workspace.</p>
 {p.error&&<p style={{color:"#b42318",fontSize:13}}>{p.error}</p>}{p.message&&<p style={{color:"#027a48",fontSize:13}}>{p.message}</p>}
 <form action={loginAction} style={{display:"grid",gap:16,marginTop:24}}><div><label className="label">Email address</label><input className="field" type="email" name="email" required/></div><div><label className="label">Password</label><input className="field" type="password" name="password" required/></div><button className="btn btn-primary">Sign in</button></form>
 <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginTop:18}}><Link href="/forgot-password" style={{color:"#3157d5"}}>Forgot password?</Link><Link href="/register" style={{color:"#3157d5"}}>Create account</Link></div></div></main>;
}
