import { getSession } from "@/lib/sessions";

export async function GET() {
  const payload = await getSession();

  if (!payload) {
    return Response.json({});
  }

  return Response.json({
    user: {
      userId: payload.userId,
    },
  });
}
