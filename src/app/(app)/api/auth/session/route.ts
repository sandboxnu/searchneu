import { getSession } from "@/lib/sessions";

export async function GET() {
  const payload = await getSession();

  if (!payload) {
    return Response.json({});
  }

  const uid = payload.userId as string;

  return Response.json({
    user: {
      userId: uid,
    },
  });
}
