import { NextRequest } from "next/server";
import { verifyUser } from "../dal/audits";

type AuthUser = { id: string };

export function withAuth<P = object>(
  handler: (req: NextRequest, user: AuthUser, params: P) => Promise<Response>,
) {
  return async (req: NextRequest, { params }: { params: Promise<P> }) => {
    try {
      const user = await verifyUser();
      if (!user)
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      const resolved = await params;
      return await handler(req, user, resolved);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Response.json({ error: message }, { status: 400 });
    }
  };
}
