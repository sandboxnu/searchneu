import { config } from "@/lib/auth/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/auth/utils";
import { db } from "@/db";
import { usersT } from "@/db/schema";
import { eq } from "drizzle-orm";
import { City } from "@/components/icons/city";
import { OnboardingFlow } from "@/components/auth/OnboardingFlow";

export function generateMetadata() {
  return {
    title: "Link",
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieJar = await cookies();
  const params = await searchParams;
  const redirectUri = params.redirect_uri?.toString();

  const jwt = cookieJar.get(config.cookieName)?.value;
  if (!jwt) {
    redirect(redirectUri ?? "/");
  }

  const guid = await verifyJWT(jwt);
  if (!guid) {
    redirect(redirectUri ?? "/");
  }

  const users = await db
    .select({
      name: usersT.name,
      email: usersT.email,
      image: usersT.image,
      acceptedTerms: usersT.acceptedTerms,
      phoneNumber: usersT.phoneNumber,
      phoneNumberVerified: usersT.phoneNumberVerified,
    })
    .from(usersT)
    .where(eq(usersT.guid, guid));

  if (users.length === 0) {
    return Response.json({ guid: null });
  }

  const user = users[0];

  if (user.acceptedTerms && user.phoneNumberVerified) {
    redirect(redirectUri ?? "/");
  }

  return (
    <div className="flex h-screen min-h-[500px] w-full flex-col justify-center">
      <div className="sunset absolute top-0 -z-20 h-full w-full"></div>
      <City className="absolute bottom-0 -z-10 min-h-48 max-w-screen" />
      <div className="ml-[10%] w-[80%] max-w-[800px] space-y-2">
        <OnboardingFlow redirectUri={redirectUri ?? "/"} />
      </div>
    </div>
  );
}
