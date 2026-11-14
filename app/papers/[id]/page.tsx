import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PaperDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: paper, error } = await supabase
    .from("question_papers")
    .select("*,subjects(name,code),courses(name),semesters(name)")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (error || !paper) notFound();

  const { data: signed } = await supabase.storage
    .from("question-papers")
    .createSignedUrl(paper.storage_path, 300);

  return (
    <main className="container paper-detail-page" style={{ paddingTop: 42 }}>
      <Link href="/papers" className="muted" style={{ fontSize: 13 }}>← Back to papers</Link>
      <div className="paper-detail-grid">
        <section className="panel" style={{ padding: 24 }}>
          <span className="tag">{paper.exam_type}</span>
          <h1 style={{ fontSize: "clamp(25px, 4vw, 30px)", lineHeight: 1.2, margin: "14px 0" }}>{paper.title}</h1>
          <p className="muted">
            {paper.subjects?.name} {paper.subjects?.code ? `· ${paper.subjects.code}` : ""} · {paper.courses?.name} · {paper.semesters?.name} · {paper.academic_year}
          </p>
          {paper.description && <p style={{ lineHeight: 1.7 }}>{paper.description}</p>}
          {signed?.signedUrl ? (
            <div style={{ marginTop: 22 }}>
              <iframe title="Question paper PDF" src={signed.signedUrl} className="paper-preview" />
              <a className="btn btn-primary" href={signed.signedUrl} target="_blank" rel="noreferrer" style={{ marginTop: 14 }}>Open / download PDF</a>
            </div>
          ) : (
            <p className="muted">Preview unavailable. Please try again later.</p>
          )}
        </section>
        <aside className="panel" style={{ padding: 22 }}>
          <h3 style={{ marginTop: 0 }}>Paper details</h3>
          <p className="muted" style={{ fontSize: 13 }}>File name</p>
          <b style={{ fontSize: 13, overflowWrap: "anywhere" }}>{paper.file_name}</b>
          <p className="muted" style={{ fontSize: 13, marginTop: 20 }}>Uploaded</p>
          <b style={{ fontSize: 13 }}>{new Date(paper.created_at).toLocaleDateString("en-IN")}</b>
        </aside>
      </div>
    </main>
  );
}
