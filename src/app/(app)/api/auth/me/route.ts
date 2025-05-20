import { db } from "@/db";
import { usersT } from "@/db/schema";
import { config, verifyJWT } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

const unauthorizardRes = Response.json(
  {
    guid: null,
  },
  {
    status: 400,
  },
);

export async function GET() {
  const cookieJar = await cookies();
  const jwt = cookieJar.get(config.cookieName)?.value;

  if (!jwt) {
    return unauthorizardRes;
  }

  const guid = await verifyJWT(jwt);
  if (!guid) {
    return unauthorizardRes;
  }

  const users = await db
    .select({
      name: usersT.name,
      email: usersT.email,
      image: usersT.image,
    })
    .from(usersT)
    .where(eq(usersT.guid, guid));

  if (users.length === 0) {
    return unauthorizardRes;
  }

  const user = users[0];

  return Response.json({
    guid: guid,
    name: user.name,
    email: user.email,
    image: user.image,
  });
}
