import { Searchskie } from "@/components/icons/Searchskie";

export default async function Page() {
  return (
    <div className="bg-neu1 grid h-full min-h-0 w-full place-content-center overflow-y-scroll rounded-lg rounded-b-none border border-b-0">
      <div className="flex flex-col items-center gap-2 text-center">
        <Searchskie className="w-72 pb-8" />
        <h1 className="text-xl font-semibold">Looking for something?</h1>
        <p className="text-muted-foreground text-sm">
          Search for a course or use the scheduler to plan your semester
        </p>
      </div>
    </div>
  );
}
