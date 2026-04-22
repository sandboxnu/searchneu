import { getMajor } from "@/lib/dal/catalog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string; name: string }> },
) {
  const { year, name } = await params;
  const major = await getMajor(parseInt(year, 10), decodeURIComponent(name));

  if (!major) {
    return Response.json({ error: "Major not found" }, { status: 404 });
  }

  return Response.json(major);
}
