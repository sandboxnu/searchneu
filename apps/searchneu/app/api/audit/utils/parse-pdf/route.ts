import { withAuth } from "@/lib/api/withAuth";
import { parsePdfCourses } from "@/lib/graduate/parsePdf";

/**
 * Parses an uploaded PDF and extracts course information.
 *
 * @param req - The request containing the file
 *
 * @returns 200 with array of parsed courses
 * @returns 401 if user is not authenticated
 * @returns 400 if no file or parsing fails
 */
export const POST = withAuth(async (req) => {
  const formData = await req.formData();
  const value = formData.get("pdf");

  if (!(value instanceof File)) {
    return Response.json({ error: "No PDF Given" }, { status: 400 });
  }

  if (value.type !== "application/pdf") {
    return Response.json({ error: "Invalid file type" }, { status: 400 });
  }

  const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  if (typeof value.size === "number" && value.size > MAX_PDF_SIZE_BYTES) {
    return Response.json({ error: "PDF too large" }, { status: 413 });
  }

  const arrayBuffer = await value.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const courses = await parsePdfCourses(buffer);

  return Response.json(courses);
});
