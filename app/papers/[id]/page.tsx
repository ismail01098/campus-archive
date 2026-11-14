import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PaperDetail({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const supabase=await createClient();
  const {data:p,error}=await supabase.from("question_papers").select("*,subjects(name,code),courses(name),semesters(name)").eq("id",id).eq("status","approved").single();
  if(error||!p) notFound();
  const {data:signed}=await supabase.storage.from("question-papers").createSignedUrl(p.storage_path,300);
  return <main className="container" style={{paddingTop:42}}>
    <Link href="/papers" className="muted" style={{fontSize:13}}>← Back to papers</Link>
    <div style={{marginTop:18,display:"grid",gridTemplateColumns:"minmax(0,1fr) 300px",gap:22}}>
      <section className="panel" style={{padding:24}}>
        <span className="tag">{p.exam_type}</span><h1 style={{fontSize:30,margin:"14px 0"}}>{p.title}</h1>
        <p className="muted">{p.subjects?.name} {p.subjects?.code ? `· ${p.subjects.code}` : ""} · {p.courses?.name} · {p.semesters?.name} · {p.academic_year}</p>
        {p.description&&<p style={{lineHeight:1.7}}>{p.description}</p>}
        {signed?.signedUrl ? <div style={{marginTop:22}}><iframe title="Question paper PDF" src={signed.signedUrl} style={{width:"100%",height:"75vh",border:"1px solid #e7eaf0",borderRadius:12}}/><a className="btn btn-primary" href={signed.signedUrl} target="_blank" rel="noreferrer" style={{marginTop:14}}>Open / download PDF</a></div> : <p className="muted">Preview unavailable. Please try again later.</p>}
      </section>
      <aside className="panel" style={{padding:22,height:"fit-content"}}><h3 style={{marginTop:0}}>Paper details</h3><p className="muted" style={{fontSize:13}}>File name</p><b style={{fontSize:13,overflowWrap:"anywhere"}}>{p.file_name}</b><p className="muted" style={{fontSize:13,marginTop:20}}>Uploaded</p><b style={{fontSize:13}}>{new Date(p.created_at).toLocaleDateString("en-IN")}</b></aside>
    </div>
  </main>;
}
