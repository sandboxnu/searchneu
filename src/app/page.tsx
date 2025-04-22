import { HomeSearch } from "@/components/HomeSearch";
import { City } from "@/components/icons/city";
import { Logo } from "@/components/icons/logo";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getTerms } from "@/lib/controllers/getTerms";

// cache the terms - every request does not need to hit the db
const cachedTerms = unstable_cache(async () => getTerms(), ["terms"], {
  revalidate: 3600, // revalidate every hour
  tags: ["terms"],
});

export default function Home() {
  const terms = cachedTerms();

  return (
    <div className="relative flex h-full min-h-[500px] w-full flex-col justify-center">
      <div className="sunset absolute top-0 -z-20 h-full w-full"></div>
      <City className="absolute bottom-0 -z-10 min-h-48 max-w-screen" />
      <div className="ml-[10%] w-[80%] max-w-[800px] space-y-2">
        <Logo className="w-2/3 max-w-[450px] min-w-[220px]" />
        <Suspense fallback={<p>loading...</p>}>
          <HomeSearch terms={terms} />
        </Suspense>
      </div>
    </div>
  );
}
