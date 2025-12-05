import { getTerms } from "@/lib/controllers/getTerms";
import { redirect } from "next/navigation";

export default async function Page() {
  const terms = await getTerms();
  redirect(`/rooms/${terms.neu[0].term}`);
}
