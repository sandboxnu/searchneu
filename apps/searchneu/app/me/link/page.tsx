import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { City } from "@/components/icons/city";
import { OnboardingFlow } from "@/components/auth/OnboardingFlow";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";

export function generateMetadata(): Metadata {
  return {
    title: "Link",
  };
}

export default async function Page(props: PageProps<"/me/link">) {
  const params = await props.searchParams;
  const redirectUri = params.redirect_uri?.toString();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(redirectUri ?? "/");
  }

  if (session.user.acceptedTerms && session.user.phoneNumberVerified) {
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
