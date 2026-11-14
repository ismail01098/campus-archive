
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UploadForm } from "./upload-form";

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  const isEmailVerified = Boolean(user.email_confirmed_at);

  const isActive =
    profile?.status?.trim().toLowerCase() === "active";

  const canUpload = isEmailVerified && isActive;

  const [
    { data: courses, error: coursesError },
    { data: semesters, error: semestersError },
    { data: subjects, error: subjectsError },
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id,name")
      .eq("active", true)
      .order("name"),

    supabase
      .from("semesters")
      .select("id,name")
      .eq("active", true)
      .order("name"),

    supabase
      .from("subjects")
      .select("id,name,code,course_id,semester_id")
      .eq("active", true)
      .order("name"),
  ]);

  console.log("UPLOAD PROFILE ERROR:", profileError);
  console.log("UPLOAD COURSES ERROR:", coursesError);
  console.log("UPLOAD SEMESTERS ERROR:", semestersError);
  console.log("UPLOAD SUBJECTS ERROR:", subjectsError);

  return (
    <main
      className="container"
      style={{
        maxWidth: 850,
        paddingTop: 42,
        paddingBottom: 50,
      }}
    >
      <div className="panel upload-panel" style={{ padding: 28 }}>
        <h1 style={{ fontSize: 30 }}>
          Upload a question paper
        </h1>

        <p className="muted">
          Contribute a paper to the campus archive.
          Your upload stays private until approved.
        </p>

        {params.message && (
          <div
            style={{
              padding: 12,
              background: "#ecfdf3",
              color: "#027a48",
              borderRadius: 8,
              marginTop: 16,
            }}
          >
            {params.message}
          </div>
        )}

        {!canUpload ? (
          <div
            className="panel"
            style={{
              padding: 16,
              background: "#fffaf0",
              marginTop: 20,
            }}
          >
            <b>Account verification required</b>

            <p style={{ marginBottom: 0 }}>
              {!isEmailVerified
                ? "Please verify your email address before uploading."
                : "Your account is not active. Please contact your administrator."}
            </p>
          </div>
        ) : profileError ? (
          <p style={{ color: "#b42318", marginTop: 20 }}>
            Could not verify your account permissions. Please try again.
          </p>
        ) : coursesError || semestersError || subjectsError ? (
          <p style={{ color: "#b42318", marginTop: 20 }}>
            Could not load the upload form data. Please check database permissions.
          </p>
        ) : (
          <UploadForm
            courses={courses || []}
            semesters={semesters || []}
            subjects={subjects || []}
          />
        )}
      </div>
    </main>
  );
}
