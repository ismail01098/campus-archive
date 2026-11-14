
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
    .select(
      "id,title,academic_year,exam_type,created_at,subjects(name,code),courses(name),semesters(name)"
    )
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <main>
      <section
        style={{
          background: "linear-gradient(120deg,#111d45,#263f91)",
          color: "white",
          padding: "76px 0 82px",
        }}
      >
        <div className="container" style={{ maxWidth: 1160 }}>
          <div
            className="tag"
            style={{
              background: "rgba(255,255,255,.13)",
              color: "#e5eaff",
              marginBottom: 22,
            }}
          >
            THE ACADEMIC LIBRARY FOR YOUR CAMPUS
          </div>

          <h1
            style={{
              fontSize: "clamp(38px,6vw,66px)",
              lineHeight: 1.04,
              letterSpacing: "-.045em",
              maxWidth: 760,
              margin: "0 0 20px",
            }}
          >
            Every past paper.
            <br />
            One place to find it.
          </h1>

          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: "#d7def9",
              maxWidth: 620,
              margin: "0 0 30px",
            }}
          >
            Search previous-year question papers by course, semester, subject,
            year and topic. Study smarter with resources shared by your campus
            community.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              className="btn"
              href="/papers"
              style={{ background: "white", color: "#1d347f" }}
            >
              Explore question papers <ArrowRight size={17} />
            </Link>

            <Link
              className="btn"
              href="/register"
              style={{
                borderColor: "rgba(255,255,255,.4)",
                color: "white",
                background: "rgba(255,255,255,.08)",
              }}
            >
              Join your campus
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              gap: 34,
              marginTop: 52,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>
                {count ?? 0}+
              </div>
              <div style={{ fontSize: 12, color: "#c4cff5" }}>
                Approved papers
              </div>
            </div>

            <div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>Searchable</div>
              <div style={{ fontSize: 12, color: "#c4cff5" }}>
                By subject & semester
              </div>
            </div>

            <div>
              <div style={{ fontSize: 30, fontWeight: 800 }}>Community</div>
              <div style={{ fontSize: 12, color: "#c4cff5" }}>
                Student contributions
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingTop: 50 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 15,
            marginBottom: 18,
          }}
        >
          <div>
            <p
              className="muted"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".1em",
              }}
            >
              START EXPLORING
            </p>
            <h2 style={{ fontSize: 27, margin: "5px 0" }}>
              Find what you need
            </h2>
          </div>

          <Link
            href="/papers"
            style={{ fontSize: 14, fontWeight: 700, color: "#3157d5" }}
          >
            Browse all papers →
          </Link>
        </div>

        <div className="card-grid">
          {[
            {
              icon: Search,
              title: "Search by subject",
              desc: "Find papers using subject names, codes or hashtags.",
            },
            {
              icon: BookOpen,
              title: "Browse by semester",
              desc: "Explore papers organized by course and semester.",
            },
            {
              icon: UploadCloud,
              title: "Contribute resources",
              desc: "Verified students can share papers for review.",
            },
          ].map((x) => (
            <div className="panel" key={x.title} style={{ padding: 22 }}>
              <x.icon size={23} color="#3157d5" />
              <h3 style={{ margin: "17px 0 8px", fontSize: 17 }}>
                {x.title}
              </h3>
              <p
                className="muted"
                style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}
              >
                {x.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ paddingTop: 52 }}>
        <h2 style={{ fontSize: 25, marginBottom: 18 }}>Recently added</h2>

        {!recent?.length ? (
          <div
            className="panel"
            style={{ padding: 28, color: "#667085" }}
          >
            No approved papers yet. Once an administrator approves submissions,
            they will appear here.
          </div>
        ) : (
          <div className="card-grid">
            {recent.map((p) => (
              <Link
                href={`/papers/${p.id}`}
                className="panel"
                key={p.id}
                style={{ padding: 20, display: "block" }}
              >
                <FileText color="#3157d5" />

                <h3 style={{ fontSize: 16, margin: "13px 0 8px" }}>
                  {p.title}
                </h3>

                <p
                  className="muted"
                  style={{ fontSize: 13, margin: 0 }}
                >
                  {p.subjects?.[0]?.name} · {p.semesters?.[0]?.name} ·{" "}
                  {p.academic_year}
                </p>

                <span className="tag" style={{ marginTop: 14 }}>
                  {p.exam_type}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="container" style={{ paddingTop: 44 }}>
        <div
          className="panel"
          style={{
            padding: 24,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <ShieldCheck color="#3157d5" size={25} />

          <div style={{ flex: 1, minWidth: 220 }}>
            <b>Shared by students. Reviewed before publishing.</b>
            <p
              className="muted"
              style={{ fontSize: 13, margin: "5px 0 0" }}
            >
              Uploads remain private until an administrator approves them.
            </p>
          </div>

          <Link className="btn btn-secondary" href="/register">
            Create student account
          </Link>
        </div>
      </section>
    </main>
  );
}
