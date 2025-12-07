"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddCoursesModal } from "@/components/scheduler/AddCourseModal";

export function AddCoursesWithModal({
  term,
  termName,
}: {
  term: string;
  termName: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="mt-4">
        Add Courses
      </Button>

      <AddCoursesModal
        open={isOpen}
        onOpenChange={setIsOpen}
        term={term}
        termName={termName}
      />
    </>
  );
}

