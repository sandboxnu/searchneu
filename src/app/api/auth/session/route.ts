import { getSession } from "@/lib/sessions";

export async function GET() {
  const payload = await getSession();

  return Response.json({
    user: {
      // @ts-expect-error need to type the payload
      userId: payload.userId,
    },
  });
}
