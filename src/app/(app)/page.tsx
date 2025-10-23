import { Suspense } from "react";
import { NeuSearchskiePattern } from "@/components/home/NeuSearchskiePattern";
import { Header } from "@/components/navigation/Header";

export default async function Home() {
  return (
    <div className="px-4 py-6">
      <NeuSearchskiePattern count={300} />
      <Header />

      <div className="mt-[10%] flex flex-col items-center gap-3 text-6xl font-bold">
        <span className="flex gap-3">
          <p className="text-neu italic">Never</p>
          <p>miss an open</p>
        </span>
        <span>
          <p>waitlist seat again</p>
        </span>
      </div>

      <div>
        {/* <Suspense> */}
        {/*   <CourseCards /> */}
        {/* </Suspense> */}
      </div>

      <div></div>
    </div>
  );
}
