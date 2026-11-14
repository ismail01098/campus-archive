import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Search,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { count } = await supabase
    .from("question_papers")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { data: recent } = await supabase
    .from("question_papers")
    .select("id,title,academic_year,exam_type,created_at,subjects(name,code),courses(name),semesters(name)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main>
      <section className="hero-section" style={{ background: "linear-gradient(120deg,#111d45,#263f91)", color: "white" }}>
        <div className="container" style={{ maxWidth: 1160 }}>
          <div className="tag" style={{ background: "rgba(255,255,255,.13)", color: "#e5eaff", marginBottom: 22 }}>
            THE ACADEMIC LIBRARY FOR YOUR CAMPUS
          </div>
          <h1 className="hero-title">Every past paper.<br />One place to find it.</h1>
          <p className="hero-copy">
            Search previous-year question papers by course, semester, subject,
            year and topic. Study smarter with resources shared by your campus
            community.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/papers" style={{ background: "white", color: "#1d347f" }}>
              Explore question papers <ArrowRight size={17} />
            </Link>
            <Link className="btn" href="/register" style={{ borderColor: "rgba(255,255,255,.4)", color: "white", background: "rgba(255,255,255,.08)" }}>
              Join your campus
            </Link>
          </div>
          <div className="hero-stats">
            <div><div className="hero-stat-value">{count ?? 0}+</div><div style={{ fontSize: 12, color: "#c4cff5" }}>Approved papers</div></div>
            <div><div className="hero-stat-value">Searchable</div><div style={{ fontSize: 12, color: "#c4cff5" }}>By subject & semester</div></div>
            <div><div className="hero-stat-value">Community</div><div style={{ fontSize: 12, color: "#c4cff5" }}>Student contributions</div></div>
          </div>
        </div>
      </section>

      <section className="container home-section home-discover" style={{ paddingTop: 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 15, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <p className="muted" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em" }}>START EXPLORING</p>
            <h2 style={{ fontSize: 27, margin: "5px 0" }}>Find what you need</h2>
          </div>
          <Link href="/papers" style={{ fontSize: 14, fontWeight: 700, color: "#3157d5" }}>Browse all papers →</Link>
        </div>

        <div className="card-grid">
          {[
            { icon: Search, title: "Search by subject", desc: "Find papers using subject names, codes or hashtags." },
            { icon: BookOpen, title: "Browse by semester", desc: "Explore papers organized by course and semester." },
            { icon: UploadCloud, title: "Contribute resources", desc: "Verified students can share papers for review." },
          ].map((item) => (
            <div className="panel" key={item.title} style={{ padding: 22 }}>
              <item.icon size={23} color="#3157d5" />
              <h3 style={{ margin: "17px 0 8px", fontSize: 17 }}>{item.title}</h3>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container home-section home-recent" style={{ paddingTop: 52 }}>
        <h2 style={{ fontSize: 25, marginBottom: 18 }}>Recently added</h2>
        {!recent?.length ? (
          <div className="panel" style={{ padding: 28, color: "#667085" }}>
            No approved papers yet. Once an administrator approves submissions, they will appear here.
          </div>
        ) : (
          <div className="card-grid">
            {recent.map((paper) => (
              <Link href={`/papers/${paper.id}`} className="panel" key={paper.id} style={{ padding: 20, display: "block" }}>
                <FileText color="#3157d5" />
                <h3 style={{ fontSize: 16, margin: "13px 0 8px" }}>{paper.title}</h3>
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                  {paper.subjects?.[0]?.name} · {paper.semesters?.[0]?.name} · {paper.academic_year}
                </p>
                <span className="tag" style={{ marginTop: 14 }}>{paper.exam_type}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container home-section home-trust" style={{ paddingTop: 44 }}>
        <div className="panel" style={{ padding: 24, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <ShieldCheck color="#3157d5" size={25} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <b>Shared by students. Reviewed before publishing.</b>
            <p className="muted" style={{ fontSize: 13, margin: "5px 0 0" }}>
              Uploads remain private until an administrator approves them.
            </p>
          </div>
          <Link className="btn btn-secondary" href="/register">Create student account</Link>
        </div>
      </section>
    </main>
  );
}
