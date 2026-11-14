
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { registerAction } from "@/app/auth-actions";

export default async function Register({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const p = await searchParams;
  const supabase = await createClient();

  const [coursesResult, semestersResult] = await Promise.all([
    supabase
      .from("courses")
      .select("id, name")
      .eq("active", true)
      .order("name"),

    supabase
      .from("semesters")
      .select("id, name")
      .eq("active", true)
      .order("sort_order"),
  ]);

  console.log(
    "COURSES ERROR:",
    coursesResult.error?.message ?? "No error"
  );

  console.log(
    "SEMESTERS ERROR:",
    semestersResult.error?.message ?? "No error"
  );

  console.log("COURSES DATA:", coursesResult.data);
  console.log("SEMESTERS DATA:", semestersResult.data);

  const courses = coursesResult.data ?? [];
  const semesters = semestersResult.data ?? [];

  const fields = [
    ["Full name", "name", "text"],
    ["Student ID / registration number", "studentId", "text"],
    ["Email address (personal or college)", "email", "email"],
    ["College access code", "code", "text"],
    ["Password (minimum 8 characters)", "password", "password"],
  ] as const;

  return (
    <main className="container" style={{ maxWidth: 540, paddingTop: 42 }}>
      <div className="panel" style={{ padding: 28 }}>
        <p className="tag">COLLEGE STUDENTS</p>

        <h1 style={{ fontSize: 30 }}>Create your account</h1>

        <p className="muted">
          Enter the access code shared by your college administrator.
        </p>

        {p.error && (
          <p style={{ color: "#b42318", fontSize: 13 }}>
            {p.error}
          </p>
        )}

        {coursesResult.error && (
          <p style={{ color: "#b42318", fontSize: 13 }}>
            Could not load courses. Please try again later.
          </p>
        )}

        {semestersResult.error && (
          <p style={{ color: "#b42318", fontSize: 13 }}>
            Could not load semesters. Please try again later.
          </p>
        )}

        <form
          action={registerAction}
          style={{ display: "grid", gap: 13, marginTop: 20 }}
        >
          {fields.map(([label, name, type]) => (
            <div key={name}>
              <label className="label" htmlFor={name}>
                {label}
              </label>

              <input
                id={name}
                className="field"
                name={name}
                type={type}
                required
                minLength={name === "password" ? 8 : undefined}
              />
            </div>
          ))}

          <div>
            <label className="label" htmlFor="course">
              Course
            </label>

            <select
              id="course"
              className="field"
              name="course"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select course
              </option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="semester">
              Current semester
            </label>

            <select
              id="semester"
              className="field"
              name="semester"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Select semester
              </option>

              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" style={{ marginTop: 6 }}>
            Register
          </button>
        </form>

        <p
          className="muted"
          style={{ fontSize: 12, lineHeight: 1.6, marginTop: 18 }}
        >
          You must verify your email before your student account becomes active.
          Account registration codes never grant administrator access.
        </p>

        <p style={{ fontSize: 13 }}>
          Already registered?{" "}
          <Link href="/login" style={{ color: "#3157d5" }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
