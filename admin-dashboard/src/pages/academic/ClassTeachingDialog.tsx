import { useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import {
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/Fields";

import {
  academicClassLabel,
  apiErrorInfo,
  isPopulated,
  refId,
  subjectLabel,
  teacherUserLabel,
  useCreateClassSubjectMutation,
  useCreateTeacherAssignmentMutation,
  useListAcademicSemestersQuery,
  useListAcademicSessionsQuery,
  useListClassSubjectsQuery,
  useListSubjectsQuery,
  useListTeacherAssignmentsQuery,
  useListTeacherUsersQuery,
  useUpdateClassSubjectMutation,
  useUpdateTeacherAssignmentMutation,
  type AcademicClassRecord,
  type ClassSubjectRecord,
  type TeacherAssignmentRecord,
} from "@/features/academic/api";

type CourseForm = {
  subject: string;
  teacher: string;
  description: string;
};

const emptyCourseForm: CourseForm = {
  subject: "",
  teacher: "",
  description: "",
};

function sessionLabel(value: { name: string } | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name;
}

function semesterLabel(value: { name: string } | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name;
}

function loadErrorMessage(value: unknown): string {
  try {
    return apiErrorInfo(value).message;
  } catch {
    return value instanceof Error ? value.message : "Request failed.";
  }
}

export function ClassTeachingDialog({
  academicClass,
  onClose,
}: {
  academicClass: AcademicClassRecord;
  onClose: () => void;
}) {
  const [createClassSubject] = useCreateClassSubjectMutation();
  const [createTeacherAssignment] = useCreateTeacherAssignmentMutation();
  const [updateTeacherAssignment] = useUpdateTeacherAssignmentMutation();
  const [updateClassSubject] = useUpdateClassSubjectMutation();

  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [termInitialized, setTermInitialized] = useState(false);
  const [sessionFilter, setSessionFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [courseForm, setCourseForm] = useState<CourseForm>(emptyCourseForm);
  const [teacherDrafts, setTeacherDrafts] = useState<Record<string, string>>({});

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
  } = useListAcademicSessionsQuery({ limit: 500 });

  const {
    data: semestersData,
    isLoading: semestersLoading,
    isError: semestersError,
    refetch: refetchSemesters,
  } = useListAcademicSemestersQuery({ limit: 500 });

  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    isError: subjectsError,
    refetch: refetchSubjects,
  } = useListSubjectsQuery({ limit: 500 });

  const {
    data: classSubjectsData,
    isLoading: classSubjectsLoading,
    isError: isClassSubjectsError,
    refetch: refetchClassSubjects,
  } = useListClassSubjectsQuery({ limit: 500 });

  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    refetch: refetchAssignments,
  } = useListTeacherAssignmentsQuery({ limit: 500 });

  const { data: teachersData } = useListTeacherUsersQuery();

  const sessions = sessionsData?.data ?? [];
  const semestersDataList = semestersData?.data ?? [];
  const allClassSubjects = classSubjectsData?.data ?? [];
  const assignments = assignmentsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];
  const teachers = (teachersData?.data ?? []).filter((teacher) => teacher.isActive);

  const selectClass = academicClass;

  useEffect(() => {
    if (termInitialized || !sessions.length || !semestersDataList.length) return;

    const activeSessions = sessions.filter((session) => session.isActive);
    const currentSession =
      activeSessions.find((session) => session.isCurrent) ?? activeSessions[0] ?? sessions[0];

    const candidates = semestersDataList.filter(
      (semester) =>
        refId(semester.academicSession) === currentSession?._id,
    );
    const currentSemester =
      candidates.find((semester) => semester.isCurrent) ?? candidates[0];

    setSessionFilter(currentSession?._id ?? "");
    setSemesterFilter(currentSemester?._id ?? "");
    setTermInitialized(true);
  }, [sessions, semestersDataList, termInitialized]);

  const semestersForSession = useMemo(
    () =>
      semestersDataList.filter(
        (semester) => !sessionFilter || refId(semester.academicSession) === sessionFilter,
      ),
    [sessionFilter, semestersDataList],
  );

  const selectedSems = useMemo(
    () => semestersDataList.find((semester) => semester._id === semesterFilter),
    [semesterFilter, semestersDataList],
  );

  const classSubjects = useMemo(
    () =>
      allClassSubjects.filter((course) =>
        refId(course.academicClass) === academicClass._id,
      ),
    [allClassSubjects, academicClass],
  );

  const courses = useMemo(() => {
    const visible = classSubjects.filter((course) =>
      !semesterFilter || refId(course.academicSemester) === semesterFilter,
    );

    return [...visible].sort((a, b) => subjectLabel(a.subject).localeCompare(subjectLabel(b.subject)));
  }, [classSubjects, semesterFilter]);

  const assignmentsByCourse = useMemo(() => {
    const grouped = new Map<string, TeacherAssignmentRecord[]>();
    for (const assignment of assignments) {
      const key = refId(assignment.classSubject);
      if (!key) continue;

      grouped.set(key, [...(grouped.get(key) ?? []), assignment]);
    }
    for (const values of grouped.values()) {
      values.sort((a, b) => teacherUserLabel(a.teacher).localeCompare(teacherUserLabel(b.teacher)));
    }
    return grouped;
  }, [assignments]);

  const classLevel = useMemo(
    () =>
      typeof selectClass.academicLevel === "object" && selectClass.academicLevel
        ? selectClass.academicLevel
        : null,
    [selectClass],
  );

  const sectionId = useMemo(
    () => (classLevel ? refId(classLevel.section) : ""),
    [classLevel],
  );

  const usedSubjects = useMemo(
    () =>
      new Set(
        classSubjects
          .filter((course) => refId(course.academicSemester) === semesterFilter)
          .map((course) => refId(course.subject)),
      ),
    [classSubjects, semesterFilter],
  );

  const availableSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) =>
          subject.isActive &&
          (!sectionId || refId(subject.section) === sectionId) &&
          !usedSubjects.has(subject._id),
      ),
    [sectionId, subjects, usedSubjects],
  );

  const isLoading =
    sessionsLoading ||
    semestersLoading ||
    subjectsLoading ||
    classSubjectsLoading ||
    assignmentsLoading;

  const loadError =
    sessionsError ||
    semestersError ||
    subjectsError ||
    isClassSubjectsError ||
    assignmentsError;

  const selectedSemesterName = semesterLabel(selectedSems);
  const showClassInactiveNotice = !selectClass.isActive;
  const canAddCourse = Boolean(
    selectClass.isActive &&
      semesterFilter &&
      courseForm.subject,
  );

  useEffect(() => {
    setCourseForm(emptyCourseForm);
    setTeacherDrafts({});
  }, [sessionFilter, semesterFilter]);

  const dismissNotice = () => setNotice(null);
  const dismissActionError = () => setActionError(null);

  const changeSession = (value: string) => {
    setSessionFilter(value);
    const candidates = semestersDataList.filter(
      (semester) =>
        refId(semester.academicSession) === value && semester.isActive,
    );
    setSemesterFilter(candidates.find((semester) => semester.isCurrent)?._id ?? "");
  };

  const runAction = async (key: string, action: () => Promise<void>) => {
    const previousBusy = busy;
    setBusy(key);
    try {
      await action();
      await Promise.all([
        refetchClassSubjects(),
        refetchAssignments(),
      ]);
    } catch (err) {
      setActionError(apiErrorInfo(err).message);
    } finally {
      setBusy(previousBusy);
    }
  };

  const addCourse = () =>
    void runAction("add-course", async () => {
      setActionError(null);
      if (!semesterFilter || !courseForm.subject) return;

      const created = await createClassSubject({
        academicClass: academicClass._id,
        subject: courseForm.subject,
        academicSemester: semesterFilter,
        description: courseForm.description.trim() || undefined,
        isActive: true,
      }).unwrap();

      const subjectName = subjectLabel(created.data.subject) || "New course";
      setCourseForm(emptyCourseForm);

      if (courseForm.teacher) {
        try {
          await createTeacherAssignment({
            classSubject: created.data._id,
            teacher: courseForm.teacher,
          }).unwrap();
          setNotice(`Course "${created.data.courseCode || subjectName}" added with teacher assigned.`);
        } catch (err) {
          const info = apiErrorInfo(err);
          setNotice(`Course "${created.data.courseCode || subjectName}" added.`);
          setActionError(`${info.message} Assign the teacher on the course card.`);
        }
      } else {
        setNotice(`Course "${created.data.courseCode || subjectName}" added.`);
      }
    });

  const assignTeacher = (course: ClassSubjectRecord) =>
    void runAction(`${course._id}:assign`, async () => {
      setActionError(null);
      const teacherId = teacherDrafts[course._id];
      if (!teacherId) return;

      const existing = assignmentsByCourse
        .get(course._id)
        ?.find((assignment) => refId(assignment.teacher) === teacherId);

      if (existing) {
        if (!existing.isActive) {
          await updateTeacherAssignment({
            id: existing._id,
            isActive: true,
          }).unwrap();
          setNotice(`Assignment restored for ${teacherLabel(existing)} on ${subjectLabel(course.subject)}.`);
        } else {
          setActionError(`${teacherLabel(existing)} is already assigned to this course.`);
        }
      } else {
        await createTeacherAssignment({
          classSubject: course._id,
          teacher: teacherId,
        }).unwrap();
        const teacherRecord = teachers.find((teacher) => teacher._id === teacherId);
        setNotice(`${teacherUserLabel(teacherRecord)} assigned to ${subjectLabel(course.subject)}.`);
      }
      setTeacherDrafts((drafts) => ({ ...drafts, [course._id]: "" }));
    });

  const removeAssignment = (assignment: TeacherAssignmentRecord) =>
    void runAction(`${assignment._id}:remove`, async () => {
      setActionError(null);
      await updateTeacherAssignment({
        id: assignment._id,
        isActive: false,
      }).unwrap();
      setNotice(`Assignment for ${teacherLabel(assignment)} deactivated.`);
    });

  const toggleCourse = (course: ClassSubjectRecord) =>
    void runAction(`${course._id}:toggle`, async () => {
      setActionError(null);
      await updateClassSubject({
        id: course._id,
        isActive: !course.isActive,
      }).unwrap();
      setNotice(
        `Course "${subjectLabel(course.subject)}" ${course.isActive ? "deactivated" : "activated"}.`,
      );
    });

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Courses & teachers"
      description={`${academicClassLabel(selectClass)} · assign courses and teachers by semester.`}
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {loadError && (
          <Alert
            tone="error"
            title="Could not load teaching setup"
            className="mb-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span>{loadErrorMessage(loadError)}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void Promise.all([
                    refetchSessions(),
                    refetchSemesters(),
                    refetchSubjects(),
                    refetchClassSubjects(),
                    refetchAssignments(),
                  ]);
                }}
              >
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {notice && (
          <Alert tone="success" onDismiss={dismissNotice}>
            {notice}
          </Alert>
        )}

        {actionError && (
          <Alert tone="error" onDismiss={dismissActionError}>
            {actionError}
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <SelectField
            label="Session"
            value={sessionFilter}
            onChange={(e) => changeSession(e.target.value)}
          >
            <option value="">All sessions</option>
            {sessions.map((session) => (
              <option key={session._id} value={session._id}>
                {sessionLabel(session)}
                {session.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Semester"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
          >
            <option value="">All semesters</option>
            {semestersForSession.map((semester) => (
              <option key={semester._id} value={semester._id}>
                {semesterLabel(semester)}
                {semester.isCurrent ? " (current)" : ""}
              </option>
            ))}
          </SelectField>
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-700">
              Class info
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
              <Badge tone={selectClass.isActive ? "success" : "neutral"}>
                {selectClass.isActive ? "Active class" : "Inactive class"}
              </Badge>
              <span>
                Class teacher:
                {" "}
                {selectClass.classTeacher
                  ? teacherUserLabel(selectClass.classTeacher)
                  : "None"}
              </span>
            </div>
          </div>
        </div>

        {showClassInactiveNotice && (
          <Alert tone="warning" className="mb-4">
            This class is inactive. New courses and teachers cannot be assigned.
          </Alert>
        )}

        <Card
          title="Courses"
          description={
            selectedSems
              ? `${selectedSemesterName} · ${sessionLabel(selectedSems.academicSession)}`
              : "Showing every semester."
          }
          className="!space-y-0"
        >
          <div className="space-y-3">
            <p className="text-xs text-ink-500">
              {courses.length
                ? "Open a course to assign teachers, or add a new course below."
                : `No courses found${selectedSems ? ` for ${selectedSemesterName}` : ""}.`}
            </p>

            {!isLoading && courses.length === 0 && (
              <div className="rounded-md border border-dashed border-ink-200 bg-ink-50/50 p-4 text-sm text-ink-600">
                {selectedSems
                  ? "Add a new course to get started."
                  : "Select a session and semester to add courses."}
              </div>
            )}

            {courses.map((course) => {
              const courseAssignments = assignmentsByCourse.get(course._id) ?? [];
              const activeAssignments = courseAssignments.filter(
                (assignment) => assignment.isActive,
              );
              const assignedTeacherIds = new Set(
                activeAssignments.map((assignment) => refId(assignment.teacher)),
              );
              const assignableTeachers = teachers.filter(
                (teacher) => !assignedTeacherIds.has(teacher._id),
              );
              const selectedTeacher = teacherDrafts[course._id] ?? "";
              const canManageTeachers = selectClass.isActive && course.isActive;

              return (
                <div
                  key={course._id}
                  className="rounded-lg border border-ink-100 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {subjectLabel(course.subject)}
                      </p>
                      <p className="font-mono text-xs text-ink-500">
                        {course.courseCode || "No course code"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={course.isActive ? "success" : "neutral"}>
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={course.isActive ? "outline" : "secondary"}
                        onClick={() => toggleCourse(course)}
                        disabled={busy !== null}
                        loading={busy === `${course._id}:toggle`}
                      >
                        {course.isActive ? "Deactivate course" : "Activate course"}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-medium text-ink-700">
                      Assigned teachers
                    </p>
                    {activeAssignments.length === 0 ? (
                      <p className="text-sm text-ink-600">No teacher assigned yet.</p>
                    ) : (
                      <ul className="mt-2 flex flex-col gap-2">
                        {activeAssignments.map((assignment) => (
                          <li
                            key={assignment._id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink-100 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-ink-900">
                                {teacherUserLabel(assignment.teacher)}
                              </p>
                              <p className="text-xs text-ink-500">
                                {isPopulated(assignment.teacher)
                                  ? `@${assignment.teacher.username}`
                                  : ""}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAssignment(assignment)}
                              disabled={busy !== null || !canManageTeachers}
                              loading={busy === `${assignment._id}:remove`}
                            >
                              Deactivate assignment
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {canManageTeachers && (
                      <div className="mt-3 grid gap-2 sm:grid-cols-[200px_auto] sm:items-end">
                        <SelectField
                          label="Assign teacher"
                          value={selectedTeacher}
                          onChange={(e) =>
                            setTeacherDrafts((drafts) => ({
                              ...drafts,
                              [course._id]: e.target.value,
                            }))
                          }
                          hint={
                            assignableTeachers.length === 0
                              ? "No active teachers available."
                              : undefined
                          }
                        >
                          <option value="">Select teacher…</option>
                          {assignableTeachers.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>
                              {teacher.fullName} (@{teacher.username})
                            </option>
                          ))}
                        </SelectField>
                        <Button
                          onClick={() => assignTeacher(course)}
                          disabled={busy !== null || !selectedTeacher}
                          loading={busy === `${course._id}:assign`}
                        >
                          Assign teacher
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {selectClass.isActive && (
              <div className="mt-4 rounded-lg border border-ink-200 bg-forest-50/50 p-4">
                <p className="text-sm font-semibold text-ink-900">Add course</p>
                <p className="text-xs text-ink-600">
                  Courses are created for the selected semester. Course codes are auto-generated based on level and subject prefix.
                </p>
                <div className="mt-3 grid gap-3">
                  <SelectField
                    label="Subject"
                    required
                    value={courseForm.subject}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    hint={
                      availableSubjects.length === 0
                        ? "No new subjects are available for this section and semester."
                        : undefined
                    }
                  >
                    <option value="">Select subject…</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Optional teacher"
                    value={courseForm.teacher}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, teacher: e.target.value }))
                    }
                    hint={
                      teachers.length === 0
                        ? "No active teacher accounts are available."
                        : "Leave blank to add the course without assigning a teacher."
                    }
                  >
                    <option value="">No teacher selected</option>
                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.fullName} (@{teacher.username})
                      </option>
                    ))}
                  </SelectField>
                  <TextareaField
                    label="Description"
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Optional course description…"
                  />
                  <InputField
                    label="Display note"
                    value={selectedSemesterName}
                    readOnly
                    hint="The new course will be stored in the selected session and semester."
                  />
                </div>
                <div className="mb-2 flex justify-start">
                  <Button
                    onClick={addCourse}
                    disabled={busy !== null || !canAddCourse}
                    loading={busy === "add-course"}
                  >
                    Add course
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Dialog>
  );
}

function teacherLabel(assignment: TeacherAssignmentRecord | undefined) {
  if (!assignment) return "";
  return teacherUserLabel(assignment.teacher) || assignment.teacher as unknown as string;
}
