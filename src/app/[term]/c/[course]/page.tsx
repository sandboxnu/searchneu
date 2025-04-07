import Link from "next/link";

export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const course = (await props.params)?.course ?? "";
  const query = (await props.searchParams).q ?? "";

  return (
    <div className="py-2 px-4">
      <Link href={"/202530?q=" + query}>back to search page</Link>
      {course}
    </div>
  );
}
