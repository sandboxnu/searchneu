import { getSearch } from "@/lib/controllers/getSearch";
import { getTerms } from "@/lib/controllers/getTerms";
import { ResultCard } from "@/components/search/ResultCard";
import LogoLoop from "@/components/ui/logo-loop";

export async function CourseCards() {
  const terms = await getTerms();
  const term = terms.neu[0].term;
  const courses = await getSearch(term, "", [], -1, -1, [], [], [], false);

  const cardAStarting = Math.floor(Math.random() * (courses.length - 20));
  const cardBStarting = Math.floor(Math.random() * (courses.length - 20));

  const cardsA = courses.slice(cardAStarting, cardAStarting + 20).map((s) => ({
    node: (
      <div
        key={s.id}
        className="bg-neu1 flex w-[320px] flex-col rounded-lg border p-4"
      >
        <ResultCard result={s} />
      </div>
    ),
    alt: s.name,
    href: `/catalog/${term}/${s.subject}%20${s.courseNumber}`,
  }));

  const cardsB = courses.slice(cardBStarting, cardBStarting + 20).map((s) => ({
    node: (
      <div
        key={s.id}
        className="bg-neu1 flex w-[320px] flex-col rounded-lg border p-4"
      >
        <ResultCard result={s} />
      </div>
    ),
    alt: s.name,
    href: `/catalog/${term}/${s.subject}%20${s.courseNumber}`,
  }));

  return (
    <div className="flex flex-col gap-2">
      <LogoLoop
        logos={cardsA}
        speed={15}
        direction="left"
        gap={8}
        pauseOnHover
        fadeOut
        fadeOutColor="var(--neu2)"
        ariaLabel="Technology partners"
      />
      <LogoLoop
        logos={cardsB}
        speed={15}
        direction="right"
        gap={8}
        pauseOnHover
        fadeOut
        fadeOutColor="var(--neu2)"
        ariaLabel="Technology partners"
      />
    </div>
  );
}
