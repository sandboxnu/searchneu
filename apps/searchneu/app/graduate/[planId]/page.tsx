import { PlanClient } from "@/components/graduate/PlanClient";
import { auth } from "@/lib/auth";
import { Audit } from "@/lib/graduate/types";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/");
  }

  const planId = parseInt((await params).planId);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const cookieStore = await cookies();
  const res = await fetch(`${baseUrl}/api/audit/plan/${planId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
    },
    credentials: "include",
  });
  const data = await res.json();

  if (!session.user.id) {
    return <h1> please sign in!</h1>;
  }
  if (!data.schedule) {
    return (
      <h1>
        {" "}
        no schedule found: {planId} {JSON.stringify(session.user)} DENNIS=  {JSON.stringify(data)}
      </h1>
    );
  } else {
    return (
      <PlanClient
        catalogYear={2023}
        initialPlan={data.schedule}
        planId={planId}
      />
    );
  }
}
