import { getTemplateForMajor } from "@/lib/dal/catalog";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ year: string; name: string }> },
) {
  const { year, name } = await params;
  const template = await getTemplateForMajor(
    parseInt(year, 10),
    decodeURIComponent(name),
  );

  return Response.json(template);
}
