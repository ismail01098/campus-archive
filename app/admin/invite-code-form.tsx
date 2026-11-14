"use client";

import { useActionState } from "react";
import { createInviteAction } from "./actions";

type State = { code?: string; error?: string };
const initial: State = {};

export function InviteCodeForm({ courses }: { courses: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createInviteAction, initial);

  return (
    <div>
      <form action={action} className="admin-invite-form">
        <select className="field" name="course" aria-label="Course restriction">
          <option value="">Any course</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
        </select>
        <input className="field" name="uses" type="number" min="1" max="500" defaultValue="50" aria-label="Maximum uses" />
        <button className="btn btn-primary" disabled={pending}>{pending ? "Generating…" : "Generate code"}</button>
      </form>
      {state.error && <p role="alert" style={{ color: "#b42318", fontSize: 13 }}>{state.error}</p>}
      {state.code && (
        <div style={{ marginTop: 16, padding: 16, background: "#f0fdf4", borderRadius: 12, minWidth: 0 }}>
          <b>New access code — copy it now</b>
          <p style={{ fontFamily: "monospace", fontSize: 20, margin: "10px 0", overflowWrap: "anywhere" }}>{state.code}</p>
          <p style={{ fontSize: 12, color: "#667085" }}>This code is displayed only in this response. Store and share it securely.</p>
        </div>
      )}
    </div>
  );
}
