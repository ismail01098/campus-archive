import { forgotPasswordAction } from "@/app/auth-actions";
export default async function Forgot({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}) {
 const p=await searchParams;
 return <main className="container" style={{maxWidth:460,paddingTop:60}}><div className="panel" style={{padding:28}}><h1 style={{fontSize:28}}>Reset your password</h1><p className="muted">Enter your registered email. If an account exists, Supabase will send a recovery link.</p>{p.error&&<p style={{color:"#b42318"}}>{p.error}</p>}{p.message&&<p style={{color:"#027a48"}}>{p.message}</p>}<form action={forgotPasswordAction} style={{display:"grid",gap:14}}><input className="field" name="email" type="email" placeholder="you@college.edu" required/><button className="btn btn-primary">Send recovery email</button></form></div></main>;
}
