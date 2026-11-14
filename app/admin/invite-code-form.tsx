"use client";
import { useActionState } from "react";
import { createInviteAction } from "./actions";

type State = { code?: string; error?: string };
const initial: State = {};
export function InviteCodeForm({ courses }: { courses: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createInviteAction, initial);
  return <div>
    <form action={action} style={{display:"flex",gap:10,flexWrap:"wrap"}}>
      <select className="field" name="course" style={{maxWidth:260}}>
        <option value="">Any course</option>
        {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input className="field" name="uses" type="number" min="1" max="500" defaultValue="50" style={{maxWidth:130}}/>
      <button className="btn btn-primary" disabled={pending}>{pending?"Generating…":"Generate code"}</button>
    </form>
    {state.error&&<p style={{color:"#b42318",fontSize:13}}>{state.error}</p>}
    {state.code&&<div style={{marginTop:16,padding:16,background:"#f0fdf4",borderRadius:12}}>
      <b>New access code — copy it now</b>
      <p style={{fontFamily:"monospace",fontSize:20,margin:"10px 0"}}>{state.code}</p>
      <p style={{fontSize:12,color:"#667085"}}>This code is displayed only in this response. Store and share it securely.</p>
    </div>}
  </div>;
}
