import Link from "next/link";
import { loginAction } from "@/app/auth-actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return (
    <main className="auth-shell login-page">
      <div className="panel auth-panel">
        <p className="tag">WELCOME BACK</p>
        <h1 className="auth-title">Sign in</h1>
        <p className="muted">Access your student workspace.</p>
        {params.error && <p role="alert" style={{ color: "#b42318", fontSize: 13 }}>{params.error}</p>}
        {params.message && <p role="status" style={{ color: "#027a48", fontSize: 13 }}>{params.message}</p>}
        <form action={loginAction} style={{ display: "grid", gap: 16, marginTop: 24 }}>
          <div><label className="label" htmlFor="email">Email address</label><input className="field" id="email" type="email" name="email" autoComplete="email" required /></div>
          <div><label className="label" htmlFor="password">Password</label><input className="field" id="password" type="password" name="password" autoComplete="current-password" required /></div>
          <button className="btn btn-primary" type="submit">Sign in</button>
        </form>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 13, marginTop: 18 }}>
          <Link href="/forgot-password" style={{ color: "#3157d5" }}>Forgot password?</Link>
          <Link href="/register" style={{ color: "#3157d5" }}>Create account</Link>
        </div>
      </div>
    </main>
  );
}
