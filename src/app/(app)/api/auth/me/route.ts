import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const cookieJar = await cookies();
  const jwt = cookieJar.get("searchneu.session")?.value;

  if (!jwt) {
    return Response.json(
      {
        guid: null,
      },
      {
        status: 400,
      },
    );
  }

  const guid = await verifyJWT(jwt);
  if (!guid) {
    return Response.json(
      {
        guid: null,
      },
      {
        status: 400,
      },
    );
  }

  return Response.json({
    guid: guid,
  });
}
