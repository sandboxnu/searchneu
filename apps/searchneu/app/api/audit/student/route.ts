import { withAuth } from "@/lib/api/withAuth";
import { PatchStudentDto } from "@/lib/graduate/api-dtos";
import { updateTransferCourses } from "@/lib/dal/auditMetadata";

export const PATCH = withAuth(async (req, user) => {
  const body = PatchStudentDto.safeParse(await req.json());
  if (!body.success)
    return Response.json({ error: "Invalid request" }, { status: 400 });

  const result = await updateTransferCourses(
    user.id,
    body.data.transferCourses,
  );
  if (!result)
    return Response.json({ error: "Failed to update" }, { status: 400 });

  return Response.json(result);
});
