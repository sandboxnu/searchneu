import { getTerms } from "@/lib/controllers/getTerms";

export async function GET() {
	// PERF: probably cache this somehow
	const terms = await getTerms();
	return Response.json(terms)
}

