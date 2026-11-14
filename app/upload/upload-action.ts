
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UploadState = {
  error?: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function uploadPaperAction(
  _previousState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (!user.email_confirmed_at) {
    return { error: "Please verify your email before uploading." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.status?.trim().toLowerCase() !== "active") {
    return {
      error: "Your account is not active. Please contact your administrator.",
    };
  }

  const title = String(formData.get("title") || "").trim();
  const course = String(formData.get("course") || "");
  const semester = String(formData.get("semester") || "");

  const subjectName = String(formData.get("subject") || "")
    .trim()
    .replace(/\s+/g, " ");

  const year = String(formData.get("year") || "");
  const examType = String(formData.get("examType") || "");

  const description = String(formData.get("description") || "")
    .trim()
    .slice(0, 1000);

  const rawTags = String(formData.get("tags") || "");

  if (
    !title ||
    title.length > 160 ||
    !course ||
    !semester ||
    !subjectName ||
    subjectName.length > 120 ||
    !/^20\d{2}$/.test(year)
  ) {
    return { error: "Please complete all required fields correctly." };
  }

  const [{ data: courseRow }, { data: semesterRow }] = await Promise.all([
    supabase
      .from("courses")
      .select("id")
      .eq("id", course)
      .eq("active", true)
      .maybeSingle(),

    supabase
      .from("semesters")
      .select("id")
      .eq("id", semester)
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!courseRow || !semesterRow) {
    return {
      error: "Please select a valid course and semester.",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please select a question paper file." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "The file must be smaller than 10 MB." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];

  if (!allowedExtensions.includes(extension)) {
    return {
      error: "Only PDF, JPG, JPEG and PNG files are accepted.",
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  const isPDF = bytes.subarray(0, 5).toString() === "%PDF-";

  const isJPG =
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const isPNG =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
    );

  const validFile =
    (extension === "pdf" && isPDF) ||
    (["jpg", "jpeg"].includes(extension) && isJPG) ||
    (extension === "png" && isPNG);

  if (!validFile) {
    return {
      error: "The file content does not match its extension. Select a valid file.",
    };
  }

  const contentType = isPDF
    ? "application/pdf"
    : isPNG
      ? "image/png"
      : "image/jpeg";

  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-100);

  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: storageError } = await supabase.storage
    .from("question-papers")
    .upload(path, bytes, {
      contentType,
      upsert: false,
    });

  if (storageError) {
    console.error("PAPER STORAGE ERROR:", storageError);
    return { error: "File upload failed. Please try again." };
  }

  // Find an existing subject first.
  const { data: existingSubject, error: findSubjectError } = await supabase
    .from("subjects")
    .select("id, active")
    .eq("name", subjectName)
    .eq("course_id", course)
    .eq("semester_id", semester)
    .maybeSingle();

  if (findSubjectError) {
    console.error("FIND SUBJECT ERROR:", findSubjectError);

    await supabase.storage.from("question-papers").remove([path]);

    return {
      error: "Could not check the subject. Please try again.",
    };
  }

  let subjectId: string;

  if (existingSubject) {
    if (!existingSubject.active) {
      await supabase.storage.from("question-papers").remove([path]);

      return {
        error:
          "This subject is currently inactive. Please contact an administrator.",
      };
    }

    subjectId = existingSubject.id;
  } else {
    // Create the subject only if it doesn't already exist.
    const { data: newSubject, error: insertSubjectError } = await supabase
      .from("subjects")
      .insert({
        name: subjectName,
        course_id: course,
        semester_id: semester,
        active: true,
      })
      .select("id")
      .single();

    if (insertSubjectError || !newSubject) {
      console.error("SUBJECT INSERT ERROR:", insertSubjectError);

      // Handle a possible duplicate created by another upload at the same time.
      if (insertSubjectError?.code === "23505") {
        const { data: duplicateSubject } = await supabase
          .from("subjects")
          .select("id, active")
          .eq("name", subjectName)
          .eq("course_id", course)
          .eq("semester_id", semester)
          .maybeSingle();

        if (duplicateSubject?.active) {
          subjectId = duplicateSubject.id;
        } else {
          await supabase.storage.from("question-papers").remove([path]);

          return {
            error: "Could not register the subject. Please try again.",
          };
        }
      } else {
        await supabase.storage.from("question-papers").remove([path]);

        return {
          error: "Could not register the subject. Please try again.",
        };
      }
    } else {
      subjectId = newSubject.id;
    }
  }

  // Save question paper.
  const { data: paper, error: paperError } = await supabase
    .from("question_papers")
    .insert({
      title,
      course_id: course,
      semester_id: semester,
      subject_id: subjectId,
      academic_year: year,
      exam_type: examType,
      description,
      storage_path: path,
      file_name: safeName,
      file_size: file.size,
      uploaded_by: user.id,
      status: "pending",
    })
    .select("id")
    .single();

  if (paperError || !paper) {
    console.error("PAPER DATABASE ERROR:", paperError);

    await supabase.storage.from("question-papers").remove([path]);

    return { error: "Could not save paper details. Please try again." };
  }

  // Save tags.
  const tags = [
    ...new Set(
      rawTags
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, "").toUpperCase())
        .filter((tag) => /^[A-Z0-9_-]{2,30}$/.test(tag))
    ),
  ].slice(0, 10);

  for (const tag of tags) {
    const { data: tagRow, error: tagError } = await supabase
      .from("tags")
      .upsert(
        { name: tag, slug: tag.toLowerCase() },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (tagError || !tagRow) {
      console.error("TAG ERROR:", tagError);
      continue;
    }

    const { error: relationError } = await supabase
      .from("question_paper_tags")
      .insert({
        question_paper_id: paper.id,
        tag_id: tagRow.id,
      });

    if (relationError) {
      console.error("PAPER TAG ERROR:", relationError);
    }
  }

  redirect("/dashboard?message=Upload%20submitted%20successfully");
}
