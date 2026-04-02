import NewPlanModal from "@/components/graduate/modal/NewPlanModal";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div>
      <NewPlanModal isGuest={session?.user.id !== null} />
    </div>
  );
}
