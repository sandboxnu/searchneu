import { Plan } from "./frontend/components/Plan/Plan";

export default async function Page() {
  return (
    <div>
      <Plan
        plan={{}}
        coReqErr={{}}
        preReqErr={{}}
        mutateStudentWithUpdatedPlan={() => {}}
        setIsRemove={() => {}}
      />
    </div>
  );
}