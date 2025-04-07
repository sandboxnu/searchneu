export default async function Page(props: {
  params: Promise<{ term: string; course: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const course = (await props.params)?.course ?? "";

  return <div className="py-2 px-4">{course}</div>;
}
