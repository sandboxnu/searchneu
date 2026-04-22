import { getMinor } from "@/lib/dal/catalog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string; name: string }> },
) {
  const { year, name } = await params;
  const minor = await getMinor(parseInt(year, 10), decodeURIComponent(name));

  if (!minor) {
    return Response.json({ error: "Minor not found" }, { status: 404 });
  }

  return Response.json(minor);
}
