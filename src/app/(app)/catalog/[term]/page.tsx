import { Searchskie } from "@/components/icons/Searchskie";

export default function Page() {
  return (
    <div className="hidden h-full w-full place-content-center xl:grid">
      <div className="flex flex-col items-center gap-1 text-center">
        <Searchskie className="w-72 pb-8" />
        <h1 className="text-xl font-semibold">Looking for something?</h1>
        <p className="">Select a course to see more of its information</p>
      </div>
    </div>
  );
}
