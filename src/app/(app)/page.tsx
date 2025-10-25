import { Suspense } from "react";
import { NeuSearchskiePattern } from "@/components/home/NeuSearchskiePattern";
import { Header } from "@/components/navigation/Header";
import { CourseCards } from "@/components/home/CourseCards";
import type { Metadata } from "next";
import { Search } from "@/components/home/Search";
import ClickSpark from "@/components/ui/click-spark";

export const metadata: Metadata = {
  title: "SearchNEU",
  description: "Search courses at Northeastern University",
};

export default async function Home() {
  return (
    <>
      <NeuSearchskiePattern count={200} />
      <ClickSpark
        sparkColor="#333"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <div className="px-4 py-6">
          <Header />

          <div className="text-neu8 mt-[10%] flex flex-col items-center text-4xl font-bold md:text-7xl">
            <span className="-mb-2 flex">
              <p className="text-neu mr-5 italic">Never</p>miss an open
            </span>
            <span>waitlist seat again</span>
          </div>

          <div className="mt-[5%] flex items-center justify-center">
            <Search />
          </div>

          <div className="mt-[5%]">
            <Suspense>
              <CourseCards />
            </Suspense>
          </div>
        </div>
      </ClickSpark>
    </>
  );
}
