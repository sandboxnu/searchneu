"use client";

import { Sidebar } from "../../components/graduate/Sidebar/Sidebar";
import { useGraduateStudent } from "./hooks/useGraduateStudent";
import { GraduateAPI } from "./graduateApiClient";
import { useEffect } from "react";

export default function Page() {
  const { student, isLoading, error } = useGraduateStudent();

  
  consoleaors);
    };
    
    fetchMajors();
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading your graduate plan...</p>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>No Graduate Account Found</h2>
        <p>You need to log in to GraduateNU to view your plans.</p>
        <p>Error details: {error?.message || "No student data available"}</p>
      </div>
    );
  }

  const selectedPlan =
    student.plans?.find((p) => p.id === student.primaryPlanId) ||
    student.plans?.[0];

  console.log("Selected plan:", selectedPlan);

  if (!selectedPlan) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>No Plans Found</h2>
        <p>Student: {student.fullName || student.email}</p>
        <p>
          You don't have any graduation plans yet. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ padding: "10px" }}>
        Welcome, {student.fullName || student.email}!
      </h3>
      {/* <Sidebar
        selectedPlan={selectedPlan}
        transferCourses={student.coursesTransfered || []}
        isSharedPlan={false}
      /> */}
    </div>
  );
}
