import { HomeSearch } from "@/components/HomeSearch";
import { City } from "@/components/icons/city";
import { Logo } from "@/components/icons/logo";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="relative flex h-full min-h-[500px] w-full flex-col justify-center">
      <div className="sunset fixed top-14 -z-20 h-screen w-full"></div>
      <City className="absolute bottom-0 -z-10 min-h-48 max-w-screen" />
      <div className="ml-[10%] w-[80%] max-w-[800px] space-y-2">
        <Logo className="w-2/3 max-w-[450px] min-w-[220px]" />
        <Suspense fallback={<p>loading...</p>}>
          <HomeSearch />
        </Suspense>
      </div>
    </div>
  );
}
