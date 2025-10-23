import { getTerms } from "@/lib/controllers/getTerms";
import { redirect } from "next/navigation";

export default async function Page() {
  const terms = await getTerms();
  redirect(`/catalog/${terms.neu[0]}`);
}
