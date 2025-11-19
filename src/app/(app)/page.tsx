import { Suspense } from "react";
import { NeuSearchskiePattern } from "@/components/home/NeuSearchskiePattern";
import { Header } from "@/components/navigation/Header";
import { CourseCards } from "@/components/home/CourseCards";
import type { Metadata } from "next";
import { Search } from "@/components/home/Search";
import ClickSpark from "@/components/ui/click-spark";
import { notFound } from 'next/navigation'


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
        <div className="pt-4 pb-6">
          <Header />

          <div className="text-neu8 mt-[25%] flex flex-col items-center text-4xl font-bold md:mt-[10%] md:text-7xl">
            <span className="-mb-2 flex">
              <p className="text-neu mr-3 italic md:mr-5">Never</p>miss an open
            </span>
            <span>waitlist seat again</span>
          </div>

          <div className="mt-[15%] flex items-center justify-center md:mt-[5%]">
            <Search />
          </div>

          <div className="mt-[20%] md:mt-[5%]">
            <Suspense>
              <CourseCards />
            </Suspense>
          </div>
        </div>
      </ClickSpark>
    </>
  );
}
