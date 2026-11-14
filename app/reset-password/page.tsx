"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    setMessage(error ? error.message : "Password updated. You can now sign in.");
    if (!error) setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <main className="auth-shell reset-page" style={{ maxWidth: 480 }}>
      <div className="panel auth-panel">
        <h1 className="auth-title">Choose a new password</h1>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label className="label" htmlFor="new-password">New password</label>
          <input id="new-password" className="field" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password (8+ characters)" required />
          <button className="btn btn-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
        </form>
        {message && <p className="muted" role="status">{message}</p>}
      </div>
    </main>
  );
}
