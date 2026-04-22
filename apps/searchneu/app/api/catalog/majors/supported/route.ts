import { getSupportedMajors } from "@/lib/dal/catalog";

export async function GET() {
  const data = await getSupportedMajors();
  return Response.json(data);
}
