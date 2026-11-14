import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/auth-actions";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("full_name, status").eq("id", user.id).single();
  const { data: papers, error: papersError } = await supabase
    .from("question_papers").select("id, title, status, created_at")
    .eq("uploaded_by", user.id).order("created_at", { ascending: false }).limit(10);

  if (profileError) console.error("DASHBOARD PROFILE ERROR:", profileError);
  if (papersError) console.error("DASHBOARD PAPERS ERROR:", papersError);

  const isActive = profile?.status?.trim().toLowerCase() === "active";

  return (
    <main className="container dashboard-page" style={{ paddingTop: 44 }}>
      <div className="dashboard-heading">
        <div>
          <p className="muted" style={{ fontSize: 12, fontWeight: 700 }}>STUDENT WORKSPACE</p>
          <h1 style={{ fontSize: "clamp(25px, 5vw, 32px)", lineHeight: 1.2, margin: "5px 0" }}>
            Welcome, {profile?.full_name || user.email}
          </h1>
          <p className="muted">Your uploads and saved academic resources.</p>
        </div>
        <form action={logoutAction}><button className="btn btn-secondary">Sign out</button></form>
      </div>

      {!isActive && (
        <div className="panel" style={{ padding: 18, marginTop: 20, borderColor: "#f2d7a5", background: "#fffaf0" }}>
          <b>Account verification pending</b>
          <p style={{ fontSize: 13, color: "#8a5a13", marginBottom: 0 }}>
            Your account is awaiting administrator approval. Please contact your administrator if you believe this is an error.
          </p>
        </div>
      )}

      <div className="card-grid dashboard-stats" style={{ marginTop: 24 }}>
        {[
          { n: papers?.length || 0, l: "My submissions" },
          { n: papers?.filter((paper) => paper.status === "approved").length || 0, l: "Approved" },
          { n: papers?.filter((paper) => paper.status === "pending").length || 0, l: "Pending review" },
        ].map((item) => (
          <div className="panel" key={item.l} style={{ padding: 22 }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>{item.n}</div>
            <div className="muted" style={{ fontSize: 13 }}>{item.l}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-section-heading">
        <h2 style={{ fontSize: 22, margin: 0 }}>Recent submissions</h2>
        <Link href="/upload" className="btn btn-primary">Upload a paper</Link>
      </div>

      <div className="panel dashboard-submissions" style={{ padding: 18 }}>
        {!papers?.length ? (
          <p className="muted">You have not uploaded any papers yet.</p>
        ) : (
          papers.map((paper) => (
            <div key={paper.id} className="submission-row">
              <b style={{ fontSize: 14 }}>{paper.title}</b>
              <span className="tag">{paper.status}</span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
