"use client";

import { useSupportedMajors } from "../../lib/graduate/useGraduateApi";

export default function Page() {
  const { data, error } = useSupportedMajors();

  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div>
      <h1>Hello graduates!</h1>
      <h2>Supported Majors:</h2>
      <pre>{JSON.stringify(data.supportedMajors, null, 2)}</pre>
    </div>
  );
}
