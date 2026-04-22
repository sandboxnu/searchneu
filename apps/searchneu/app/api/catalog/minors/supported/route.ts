import { getSupportedMinors } from "@/lib/dal/catalog";

export async function GET() {
  const data = await getSupportedMinors();
  return Response.json(data);
}
