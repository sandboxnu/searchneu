import data from "../../changelog.json";
import { Header } from "@/components/navigation/Header";
import { ChangelogHero } from "@/components/changelog/Hero";
import { ReleaseCard, type Release } from "@/components/changelog/ReleaseCard";
import { Timeline } from "@/components/changelog/Timeline";
import { NeuSearchskiePattern } from "@/components/home/NeuSearchskiePattern";

export default function Page() {
  return (
    <div className="relative min-h-screen px-6 py-4">
      <Header />
      <NeuSearchskiePattern count={data.releases.length * 20 + 200} />

      <ChangelogHero />
      <div className="relative z-10">
        <div className="relative flex flex-col items-center">
          <Timeline />
          {data.releases.map((release: Release, index: number) => (
            <ReleaseCard
              key={`${release.version}-${index}`}
              release={release}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
