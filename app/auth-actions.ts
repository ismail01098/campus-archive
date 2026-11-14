
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const emailSchema = z.string().email();

const registrationSchema = z.object({
  name: z.string().trim().min(2),
  studentId: z.string().trim().min(1),
  email: z.string().trim().email(),
  code: z.string().trim().min(1),
  password: z.string().min(8),
  course: z.string().uuid(),
  semester: z.string().uuid(),
});

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!emailSchema.safeParse(email).success || !password) {
    redirect("/login?error=Enter%20a%20valid%20email%20and%20password");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("LOGIN ERROR:", error.message);
    redirect(
      "/login?error=Unable%20to%20sign%20in.%20Check%20your%20details%20and%20email%20verification."
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Authentication%20failed");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.status !== "active") {
    await supabase.auth.signOut();
    redirect("/login?error=Account%20not%20active");
  }

  if (profile.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  const values = {
    name: String(formData.get("name") || "").trim(),
    studentId: String(formData.get("studentId") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    code: String(formData.get("code") || "").trim(),
    password: String(formData.get("password") || ""),
    course: String(formData.get("course") || ""),
    semester: String(formData.get("semester") || ""),
  };

  const validation = registrationSchema.safeParse(values);

  if (!validation.success) {
    redirect("/register?error=Please%20check%20all%20registration%20fields");
  }

  const supabase = await createClient();

  const { error: inviteError } = await supabase.rpc(
    "redeem_invite_code",
    {
      p_code: values.code,
      p_course_id: values.course,
    }
  );

  if (inviteError) {
    console.error("INVITE CODE ERROR:", inviteError.message);
    redirect("/register?error=Invalid%20or%20expired%20college%20access%20code");
  }

  const { error: signupError } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        full_name: values.name,
        student_id: values.studentId,
        course_id: values.course,
        semester_id: values.semester,
        role: "student",
      },
    },
  });

  if (signupError) {
    console.error("REGISTRATION ERROR:", signupError.message);
    redirect("/register?error=Unable%20to%20create%20account.%20Please%20try%20again");
  }

  redirect(
    "/login?message=Registration%20successful.%20Please%20verify%20your%20email%20before%20signing%20in."
  );
}

export async function logoutAction() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();

  if (!emailSchema.safeParse(email).success) {
    redirect("/forgot-password?error=Enter%20a%20valid%20email%20address");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    console.error("PASSWORD RESET ERROR:", error.message);
    redirect("/forgot-password?error=Unable%20to%20send%20reset%20email");
  }

  redirect(
    "/forgot-password?message=If%20your%20account%20exists,%20a%20reset%20email%20has%20been%20sent"
  );
}
