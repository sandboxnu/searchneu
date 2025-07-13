import { HomeSearch } from "@/components/HomeSearch";
import { City } from "@/components/icons/city";
import { Logo } from "@/components/icons/logo";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getTerms } from "@/lib/controllers/getTerms";
import { faqFlag } from "@/lib/flags";
import { UserIcon } from "@/components/navigation/UserMenu";
import Link from "next/link";
import { Footer } from "@/components/navigation/Footer";
import { Sandbox } from "@/components/icons/Sandbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const cachedTerms = unstable_cache(async () => getTerms(), ["banner.terms"], {
  revalidate: 3600,
  tags: ["banner.terms"],
});

export default async function Home() {
  const terms = cachedTerms();
  const enableFaqPage = await faqFlag();

  return (
    <>
      <header className="absolute top-0 z-40 flex h-14 w-full items-center justify-between p-4">
        <a href="https://www.sandboxnu.com/">
          <Sandbox className="mt-8" />
        </a>
        <div className="flex items-center gap-4">
          <nav className="space-x-2 font-semibold">
            <Link
              href="/catalog"
              className="hover:bg-neu4/60 rounded-lg px-3 py-2"
            >
              Catalog
            </Link>
            {enableFaqPage && (
              <Link
                href="/faq"
                className="hover:bg-neu4/60 rounded-lg px-3 py-2"
              >
                FAQ
              </Link>
            )}
          </nav>
          <UserIcon />
        </div>
      </header>
      <div className="flex h-screen min-h-[500px] w-full flex-col justify-center">
        <div className="sunset absolute top-0 -z-20 h-full w-full"></div>
        <City className="absolute bottom-0 -z-10 min-h-48 max-w-screen" />
        <div className="ml-[10%] w-[80%] max-w-[800px] space-y-4">
          <Logo className="w-2/3 max-w-[450px] min-w-[220px]" />
          <Badge variant="accent">
            New desgin! Learn more <PartyPopper />
          </Badge>
          <Suspense fallback={<p>loading...</p>}>
            <HomeSearch terms={terms} />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}
