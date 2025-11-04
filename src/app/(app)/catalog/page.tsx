import { getTerms } from "@/lib/controllers/getTerms";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const terms = await getTerms();
  redirect(`/catalog/${terms.neu[0].term}`);
}
