import { searchCourses } from "@/lib/dal/search";
import { getTerms } from "@/lib/dal/terms";
import { ResultCard } from "@/components/catalog/search/ResultCard";
import LogoLoop from "@/components/ui/logo-loop";

export async function CourseCards() {
  const terms = await getTerms();
  const term = terms.neu[0].term;
  const courses = await searchCourses({
    term,
    query: "",
    subjects: [],
    minCourseLevel: -1,
    maxCourseLevel: -1,
    nupaths: [],
    campuses: [],
    classTypes: [],
    honors: false,
  });

  // WARN: we should obv fix this and remove the ignore
  // eslint-disable-next-line react-hooks/purity
  const cardAStarting = Math.floor(Math.random() * (courses.length - 20));

  // WARN: we should obv fix this and remove the ignore
  // eslint-disable-next-line react-hooks/purity
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
