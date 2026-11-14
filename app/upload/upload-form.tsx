
"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import {
  uploadPaperAction,
  type UploadState,
} from "./upload-action";

type Option = {
  id: string;
  name: string;
  code?: string | null;
  course_id?: string | null;
  semester_id?: string | null;
};

const initialState: UploadState = {};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function editDistance(a: string, b: string): number {
  const matrix = Array.from(
    { length: a.length + 1 },
    () => Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] +
          (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }

  return matrix[a.length][b.length];
}

export function UploadForm({
  courses,
  semesters,
  subjects,
}: {
  courses: Option[];
  semesters: Option[];
  subjects: Option[];
}) {
  const [state, formAction, pending] = useActionState(
    uploadPaperAction,
    initialState
  );

  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [examType, setExamType] = useState("Semester examination");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");

  const [subjectSearch, setSubjectSearch] = useState("");
  const [fileName, setFileName] = useState("");

  const suggestions = useMemo(() => {
    const query = normalize(subjectSearch);

    if (!query || !course || !semester) return [];

    return subjects
      .filter(
        (subject) =>
          subject.course_id === course &&
          subject.semester_id === semester
      )
      .map((subject) => {
        const name = normalize(subject.name);
        const code = normalize(subject.code || "");

        const exact = name === query || code === query;

        const starts =
          name.startsWith(query) || code.startsWith(query);

        const contains =
          name.includes(query) || code.includes(query);

        const distance = Math.min(
          editDistance(query, name),
          code ? editDistance(query, code) : 999
        );

        return {
          subject,
          score: exact
            ? 0
            : starts
              ? 1
              : contains
                ? 2
                : distance <= 2
                  ? 3
                  : 99,
        };
      })
      .filter((item) => item.score < 99)
      .sort((a, b) => a.score - b.score)
      .slice(0, 7)
      .map((item) => item.subject);
  }, [subjectSearch, subjects, course, semester]);

  function selectSubject(subject: Option) {
    setSubjectSearch(subject.name);
  }

  return (
    <form
      action={formAction}
      style={{
        display: "grid",
        gap: 14,
        marginTop: 20,
      }}
    >
      <div>
        <label className="label">Paper title</label>
        <input
          className="field"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={160}
        />
      </div>

      <div>
        <label className="label">Course</label>
        <select
          className="field"
          name="course"
          value={course}
          onChange={(e) => {
            setCourse(e.target.value);
            setSubjectSearch("");
          }}
          required
        >
          <option value="">Select course</option>

          {courses.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Semester</label>
        <select
          className="field"
          name="semester"
          value={semester}
          onChange={(e) => {
            setSemester(e.target.value);
            setSubjectSearch("");
          }}
          required
        >
          <option value="">Select semester</option>

          {semesters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ position: "relative" }}>
        <label className="label">Subject</label>

        <input
          className="field"
          name="subject"
          placeholder="Type a subject name..."
          value={subjectSearch}
          autoComplete="off"
          onChange={(e) => setSubjectSearch(e.target.value)}
          required
          maxLength={120}
          disabled={!course || !semester}
        />

        {!course || !semester ? (
          <p className="muted" style={{ fontSize: 12 }}>
            Select your course and semester first.
          </p>
        ) : (
          <>
            {subjectSearch && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: "white",
                  border: "1px solid #d0d5dd",
                  borderRadius: 10,
                  marginTop: 4,
                  maxHeight: 240,
                  overflowY: "auto",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
                }}
              >
                {suggestions.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => selectSubject(subject)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 14px",
                      border: 0,
                      borderBottom: "1px solid #edf0f5",
                      background: "white",
                      cursor: "pointer",
                      color: "#172033",
                    }}
                  >
                    <b>{subject.name}</b>

                    {subject.code && (
                      <span
                        style={{
                          color: "#667085",
                          marginLeft: 8,
                        }}
                      >
                        {subject.code}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              {subjectSearch.trim()
                ? "Select an existing suggestion or enter a new subject name. New subjects are added automatically when you submit."
                : "Search existing subjects or type a new subject name."}
            </p>
          </>
        )}
      </div>

      <div>
        <label className="label">Academic year</label>
        <input
          className="field"
          name="year"
          placeholder="2025"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          required
          pattern="20[0-9]{2}"
        />
      </div>

      <div>
        <label className="label">Examination type</label>
        <select
          className="field"
          name="examType"
          value={examType}
          onChange={(e) => setExamType(e.target.value)}
        >
          <option>Semester examination</option>
          <option>Internal examination</option>
          <option>Model examination</option>
          <option>Supplementary examination</option>
          <option>Improvement examination</option>
          <option>Other</option>
        </select>
      </div>

      <div>
        <label className="label">Tags (comma separated)</label>
        <input
          className="field"
          name="tags"
          placeholder="DBMS, BCA, SEM2"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Description (optional)</label>
        <textarea
          className="field"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Question paper file</label>

        <input
          className="field"
          type="file"
          name="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          required
          onChange={(e) =>
            setFileName(e.target.files?.[0]?.name || "")
          }
        />

        <p
          className="muted"
          style={{ fontSize: 12, marginTop: 6 }}
        >
          PDF, JPG, JPEG or PNG · Maximum 10 MB
        </p>

        {fileName && (
          <p style={{ fontSize: 13, color: "#027a48" }}>
            Selected: {fileName}
          </p>
        )}
      </div>

      {state.error && (
        <div
          role="alert"
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#fff1f0",
            color: "#b42318",
            fontSize: 13,
          }}
        >
          {state.error}
        </div>
      )}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={pending}
      >
        {pending ? "Uploading paper..." : "Submit for review"}
      </button>
    </form>
  );
}
