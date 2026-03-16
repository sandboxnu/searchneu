import { parsePdfCourses, verifyUser } from "@/lib/controllers/auditPlans";
import { NextRequest } from "next/server";

/**
 * Parses an uploaded PDF and extracts course information.
 *
 * @param req - The request containing the file
 *
 * @returns 200 with array of parsed courses
 * @returns 401 if user is not authenticated
 * @returns 400 if no file or parsing fails
 */
export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser();

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            });
        }

        const formData = await req.formData();
        const file = formData.get("pdf") as File;

        if (!file) {
            return new Response(JSON.stringify({ error: "No PDF Given" }), {
                status: 400,
            });
        }
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const courses = await parsePdfCourses(buffer);

        return Response.json(courses);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : JSON.stringify(error);
            
        return new Response(
            JSON.stringify({ error: `Failed to parse PDF courses: ${message}` }),
            { status: 400 },
        );
    }
}