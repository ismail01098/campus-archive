import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const INPUT_DIR = path.join(ROOT, "bulk-papers");
const BUCKET = "question-papers";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const PAPERS = [
  {
    file: "SEP  BCA III Sem - Computer Networks.pdf",
    subject: "Computer Networks",
    code: "BCACACS 303",
  },
  {
    file: "SEP BCA III Sem  - Web Content Management System.pdf",
    subject: "Web Content Management System",
    code: null,
  },
  {
    file: "SEP BCA III Sem - C# & Dotnet Framework.pdf",
    subject: "C# and Dotnet Framework",
    code: "BCACACS 302",
  },
  {
    file: "SEP BCA III Sem - Database Management System.pdf",
    subject: "Database Management System",
    code: "BCACACS 301",
  },
  {
    file: "SEP BCA III Sem Enlish Language.pdf",
    subject: "English Language",
    code: "BCAENLS 301",
  },
  {
    file: "SEP BCA III Sem Hindi.pdf",
    subject: "Hindi",
    code: "BCAHDLS 301",
  },
];

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

async function main() {
  const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const email = requiredEnv("CAMPUS_ARCHIVE_ADMIN_EMAIL");
  const password = requiredEnv("CAMPUS_ARCHIVE_ADMIN_PASSWORD");

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("Signing in to Campus Archive as admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError || !authData.user) {
    throw new Error(`Admin sign-in failed: ${authError?.message ?? "No user returned"}`);
  }

  const user = authData.user;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin" || profile?.status !== "active") {
    throw new Error("This account is not an active Campus Archive administrator. No files were uploaded.");
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("code", "BCA")
    .eq("active", true)
    .single();
  if (courseError || !course) throw new Error("Active BCA course was not found.");

  const { data: semester, error: semesterError } = await supabase
    .from("semesters")
    .select("id")
    .eq("name", "Semester 3")
    .eq("active", true)
    .single();
  if (semesterError || !semester) throw new Error("Active Semester 3 was not found.");

  await stat(INPUT_DIR).catch(() => {
    throw new Error("Create a 'bulk-papers' folder in the project root and place the six supplied PDFs inside it.");
  });

  const available = new Set(await readdir(INPUT_DIR));
  const missing = PAPERS.filter((paper) => !available.has(paper.file));
  if (missing.length) {
    throw new Error(
      "These files are missing from bulk-papers:\n" +
        missing.map((paper) => ` - ${paper.file}`).join("\n")
    );
  }

  console.log("Admin verified. Uploading six Semester 3 SEP papers as pending review items.\n");

  let uploaded = 0;
  let skipped = 0;
  const failures = [];

  for (const paper of PAPERS) {
    let storagePath;

    try {
      const localPath = path.join(INPUT_DIR, paper.file);
      const bytes = await readFile(localPath);
      if (bytes.length === 0) throw new Error("File is empty.");
      if (bytes.length > MAX_FILE_SIZE) throw new Error("File exceeds the 10 MB bucket limit.");
      if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
        throw new Error("File does not have a valid PDF signature.");
      }

      const hash = createHash("sha256").update(bytes).digest("hex");
      const { data: duplicate, error: duplicateError } = await supabase
        .from("question_papers")
        .select("id, status")
        .eq("sha256", hash)
        .maybeSingle();

      if (duplicateError) throw new Error(`Duplicate check failed: ${duplicateError.message}`);
      if (duplicate) {
        console.log(`SKIP  ${paper.subject} — identical PDF already exists (${duplicate.status}).`);
        skipped++;
        continue;
      }

      const { data: existingSubject, error: subjectLookupError } = await supabase
        .from("subjects")
        .select("id, active")
        .eq("name", paper.subject)
        .eq("course_id", course.id)
        .eq("semester_id", semester.id)
        .maybeSingle();

      if (subjectLookupError) throw new Error(`Subject lookup failed: ${subjectLookupError.message}`);

      let subjectId = existingSubject?.id;
      if (existingSubject && !existingSubject.active) {
        throw new Error("The matching subject exists but is inactive; activate it in the admin panel first.");
      }

      if (!subjectId) {
        const { data: newSubject, error: createSubjectError } = await supabase
          .from("subjects")
          .insert({
            name: paper.subject,
            code: paper.code,
            course_id: course.id,
            semester_id: semester.id,
            active: true,
          })
          .select("id")
          .single();

        if (createSubjectError || !newSubject) {
          throw new Error(`Could not create subject: ${createSubjectError?.message ?? "No row returned"}`);
        }
        subjectId = newSubject.id;
      }

      const objectName = `${user.id}/${randomUUID()}-${safeFileName(paper.file)}`;
      storagePath = objectName;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(objectName, bytes, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

      const { error: insertError } = await supabase.from("question_papers").insert({
        title: `BCA Semester 3 — ${paper.subject}`,
        course_id: course.id,
        semester_id: semester.id,
        subject_id: subjectId,
        exam_type: "Semester examination",
        academic_year: "2025",
        description:
          "SEP syllabus, 2025–2026 batch onwards. Third Semester B.C.A. Degree Examination, December 2025 / January 2026.",
        storage_path: objectName,
        file_name: paper.file,
        file_size: bytes.length,
        sha256: hash,
        uploaded_by: user.id,
        status: "pending",
      });

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([objectName]);
        storagePath = undefined;
        throw new Error(`Database insert failed (uploaded file rolled back): ${insertError.message}`);
      }

      console.log(`DONE  ${paper.subject} — uploaded and submitted for admin review.`);
      uploaded++;
    } catch (error) {
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
      }
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ subject: paper.subject, message });
      console.error(`FAIL  ${paper.subject} — ${message}`);
    }
  }

  console.log("\nBulk upload summary");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped (already present): ${skipped}`);
  console.log(`Failed: ${failures.length}`);

  await supabase.auth.signOut();

  if (failures.length) {
    console.error("\nSome papers need attention. Fix the reported issue and run the script again.");
    process.exitCode = 1;
  } else {
    console.log("\nFinished. New papers remain pending until you approve them in Campus Archive.");
  }
}

main().catch((error) => {
  console.error("\nBulk upload stopped:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
