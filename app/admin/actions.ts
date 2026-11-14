
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type State = {
  code?: string;
  error?: string;
};

async function adminClient() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (
    error ||
    data?.role !== "admin" ||
    data.status !== "active"
  ) {
    return null;
  }

  return supabase;
}

export async function reviewPaperAction(formData: FormData) {
  const supabase = await adminClient();

  if (!supabase) {
    console.error("REVIEW ERROR: Administrator access required.");
    return;
  }

  const id = String(formData.get("id") || "");
  const decision = String(formData.get("decision") || "");

  if (!id || !["approved", "rejected"].includes(decision)) {
    console.error("REVIEW ERROR: Invalid paper ID or decision.");
    return;
  }

  const { data, error } = await supabase
    .from("question_papers")
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("PAPER REVIEW DATABASE ERROR:", error);
    return;
  }

  if (!data) {
    console.error("PAPER REVIEW ERROR: No pending paper was updated.");
    return;
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/papers");

  console.log(`PAPER ${id} ${decision.toUpperCase()} SUCCESSFULLY`);
}

export async function createInviteAction(
  _prev: State,
  formData: FormData
): Promise<State> {
  const supabase = await adminClient();

  if (!supabase) {
    return { error: "Administrator access required." };
  }

  const course = String(formData.get("course") || "");

  const raw = `CAMPUS-${crypto
    .randomUUID()
    .replaceAll("-", "")
    .slice(0, 12)
    .toUpperCase()}`;

  const uses = Math.max(
    1,
    Math.min(500, Number(formData.get("uses") || 50))
  );

  const { error } = await supabase.rpc("create_invite_code", {
    p_code: raw,
    p_course_id: course || null,
    p_max_uses: uses,
  });

  if (error) {
    console.error("INVITE CODE ERROR:", error);
    return {
      error: "Could not create code. Check the database function and permissions.",
    };
  }

  revalidatePath("/admin");

  return { code: raw };
}
