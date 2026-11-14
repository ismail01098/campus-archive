import { forgotPasswordAction } from "@/app/auth-actions";

export default async function Forgot({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="auth-shell forgot-page" style={{ maxWidth: 480 }}>
      <div className="panel auth-panel">
        <h1 className="auth-title">Reset your password</h1>
        <p className="muted">Enter your registered email. If an account exists, Supabase will send a recovery link.</p>
        {params.error && <p role="alert" style={{ color: "#b42318" }}>{params.error}</p>}
        {params.message && <p role="status" style={{ color: "#027a48" }}>{params.message}</p>}
        <form action={forgotPasswordAction} style={{ display: "grid", gap: 14 }}>
          <label className="label" htmlFor="email">Email address</label>
          <input className="field" id="email" name="email" type="email" autoComplete="email" placeholder="you@college.edu" required />
          <button className="btn btn-primary">Send recovery email</button>
        </form>
      </div>
    </main>
  );
}
