import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; course?: string; semester?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const supabase = await createClient();

  let query = supabase
    .from("question_papers")
    .select("id,title,academic_year,exam_type,created_at,description,subjects(name,code),courses(name),semesters(name)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(60);

  if (q) {
    query = query.or(`title.ilike.%${q}%,academic_year.ilike.%${q}%,description.ilike.%${q}%`);
  }

  const { data: papers, error } = await query;

  return (
    <main className="container papers-page" style={{ paddingTop: 46 }}>
      <div style={{ maxWidth: 720 }}>
        <p className="muted" style={{ fontWeight: 700, fontSize: 12, letterSpacing: ".1em" }}>THE REPOSITORY</p>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 36px)", margin: "8px 0" }}>Question papers</h1>
        <p className="muted">Search approved papers shared by your campus community.</p>
      </div>

      <form action="/papers" className="responsive-search">
        <input className="field" name="q" defaultValue={q} placeholder="Search subject, code, year or keyword…" aria-label="Search question papers" />
        <button className="btn btn-primary"><Search size={17} /> Search</button>
      </form>

      {error ? (
        <div className="panel" style={{ padding: 24 }}>
          Could not load papers. Check your Supabase setup and database migration.
        </div>
      ) : !papers?.length ? (
        <div className="panel" style={{ padding: 28 }}>
          <b>No papers found</b>
          <p className="muted">Try another subject name, code or year.</p>
        </div>
      ) : (
        <div className="card-grid paper-card-grid">
          {papers.map((paper) => (
            <Link key={paper.id} href={`/papers/${paper.id}`} className="panel" style={{ padding: 20, display: "block" }}>
              <span className="tag">{paper.exam_type}</span>
              <h2 style={{ fontSize: 17, margin: "13px 0 8px" }}>{paper.title}</h2>
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                {paper.subjects?.[0]?.name} {paper.subjects?.[0]?.code ? `(${paper.subjects[0].code})` : ""}
              </p>
              <p className="muted" style={{ fontSize: 12 }}>
                {paper.courses?.[0]?.name} · {paper.semesters?.[0]?.name} · {paper.academic_year}
              </p>
              <span style={{ fontSize: 13, color: "#3157d5", fontWeight: 700 }}>View paper →</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
