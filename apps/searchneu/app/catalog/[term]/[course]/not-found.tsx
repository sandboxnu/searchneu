export default function NotFound() {
  return (
    <div className="hidden h-[calc(100vh-56px)] w-full place-content-center overflow-y-scroll xl:grid">
      <div className="flex flex-col items-center gap-1 text-center">
        {/* <Searchskie className="w-72 pb-8" /> */}
        <h1 className="text-xl font-semibold">Course not found</h1>
        <p className="">
          Not all courses are offered every semester, try searching a different
          semester
        </p>
      </div>
    </div>
  );
}
