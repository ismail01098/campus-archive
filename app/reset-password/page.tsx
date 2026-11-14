"use client";
import { useState } from "react"; import { createClient } from "@/lib/supabase/client"; import { useRouter } from "next/navigation";
export default function ResetPassword(){const [password,setPassword]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);const supabase=createClient();const {error}=await supabase.auth.updateUser({password});setBusy(false);setMessage(error?error.message:"Password updated. You can now sign in.");if(!error)setTimeout(()=>router.push("/login"),1200);}
 return <main className="container" style={{maxWidth:460,paddingTop:60}}><div className="panel" style={{padding:28}}><h1 style={{fontSize:28}}>Choose a new password</h1><form onSubmit={submit} style={{display:"grid",gap:14}}><input className="field" type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password (8+ characters)" required/><button className="btn btn-primary" disabled={busy}>{busy?"Updating…":"Update password"}</button></form>{message&&<p className="muted">{message}</p>}</div></main>;
}
