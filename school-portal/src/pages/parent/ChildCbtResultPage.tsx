import { useParams } from "react-router-dom";

import { CbtResultPage } from "@/pages/student/CbtResultPage";

export function ChildCbtResultPage() {
  const { studentId = "" } = useParams();

  return (
    <CbtResultPage
      backTo={`/parent/children/${studentId}/cbt`}
      backLabel="Child CBT exams"
    />
  );
}
