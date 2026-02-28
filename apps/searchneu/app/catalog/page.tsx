import { getTerms } from "@/lib/dal/terms";
import { redirect } from "next/navigation";

export default async function Page() {
  const terms = await getTerms();
  redirect(`/catalog/${terms.neu[0].term}`);
}
