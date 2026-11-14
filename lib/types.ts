export type Paper = {
  id: string; title: string; course_id: string; semester_id: string; subject_id: string;
  exam_type: string; academic_year: string; description: string | null; storage_path: string;
  file_name: string; file_size: number; status: "pending"|"approved"|"rejected";
  created_at: string; tags?: string[];
  courses?: { name: string }; semesters?: { name: string }; subjects?: { name: string; code: string };
};
