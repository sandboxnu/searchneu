import { Searchskie } from "@/components/icons/Searchskie";

export default function Page() {
  return (
    <div className="bg-neu1 grid h-full min-h-0 w-full place-content-center overflow-y-scroll rounded-lg rounded-b-none border border-b-0">
      <div className="flex flex-col items-center gap-1 text-center">
        <Searchskie className="w-72 pb-8" />
        <h1 className="text-xl font-semibold">Looking for something?</h1>
        <p className="">Select a course to see more of its information</p>
      </div>
    </div>
  );
}
