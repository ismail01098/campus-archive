import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { reviewPaperAction } from "./actions";
import { InviteCodeForm } from "./invite-code-form";

export default async function Admin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role,status").eq("id", user.id).single();
  if (profile?.role !== "admin" || profile.status !== "active") redirect("/dashboard");

  const [{ data: pending }, { data: courses }] = await Promise.all([
    supabase.from("question_papers").select("id,title,file_name,created_at").eq("status", "pending").order("created_at"),
    supabase.from("courses").select("id,name").eq("active", true),
  ]);

  return (
    <main className="container admin-page" style={{ paddingTop: 42 }}>
      <h1 style={{ fontSize: "clamp(27px, 5vw, 32px)" }}>Administration</h1>
      <p className="muted">Review student contributions and issue registration access codes.</p>

      <section className="panel admin-section" style={{ padding: 22, marginTop: 22 }}>
        <h2 style={{ fontSize: 20 }}>Pending paper reviews ({pending?.length || 0})</h2>
        {!pending?.length ? (
          <p className="muted">No papers waiting for review.</p>
        ) : pending.map((paper) => (
          <div key={paper.id} className="admin-review-row">
            <div>
              <b>{paper.title}</b>
              <p className="muted" style={{ fontSize: 12, margin: "5px 0" }}>{paper.file_name}</p>
            </div>
            <form action={reviewPaperAction} className="admin-review-actions">
              <input type="hidden" name="id" value={paper.id} />
              <button className="btn btn-primary" name="decision" value="approved">Approve</button>
              <button className="btn btn-secondary" name="decision" value="rejected">Reject</button>
            </form>
          </div>
        ))}
      </section>

      <section className="panel" style={{ padding: 22, marginTop: 22 }}>
        <h2 style={{ fontSize: 20 }}>Generate college access code</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Share generated codes privately with eligible students. The raw code is shown only once and is not stored in plaintext.
        </p>
        <InviteCodeForm courses={courses || []} />
      </section>
    </main>
  );
}
