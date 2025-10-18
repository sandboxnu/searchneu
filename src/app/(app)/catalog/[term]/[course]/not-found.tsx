/**
 * Not Found Page
 * Displayed when a course doesn't exist or isn't offered in the selected term
 */
export default function NotFound() {
  return (
    <div className="hidden h-[calc(100vh-56px)] w-full place-content-center overflow-y-scroll xl:grid">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-xl font-semibold">Course not found</h1>
        <p>
          Not all courses are offered every semester, try searching a different
          semester
        </p>
      </div>
    </div>
  );
}
