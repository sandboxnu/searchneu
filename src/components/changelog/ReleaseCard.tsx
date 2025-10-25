import Image from "next/image";
import { TimelineDot } from "./Timeline";

export interface Feature {
  contributorUrls: string[];
  description: string;
}

export interface Release {
  version: string;
  title: string;
  notes: string;
  date: string;
  image: string;
  features: Feature[];
}

function FeatureItem({ feature }: { feature: Feature }) {
  return (
    <li className="flex items-start">
      <span className="mr-2 text-sm">•</span>
      <div className="flex-1">
        <p className="text-sm">
          {parseDescription(feature.description, feature.contributorUrls)}
        </p>
      </div>
    </li>
  );
}

export function ReleaseCard({ release }: { release: Release }) {
  return (
    <div className="relative z-10 mb-8 w-full max-w-[538px]">
      <TimelineDot />

      <h2 className="text-neu7 mb-2 text-sm">
        {formatDate(release.date)} - v{release.version}
      </h2>
      <div className="border-neu3 bg-neu1 rounded-lg border p-6">
        <Image
          src={"/images/changelog/" + release.image}
          width={1470}
          height={546}
          alt="Changelog_Image_1.png"
          className="mb-4 w-full rounded-sm"
          style={{ aspectRatio: "475/180", backgroundColor: "#1C313F" }}
        />
        <h3 className="mb-2 text-base font-black">{release.title}</h3>
        <h4 className="text-neu8 mb-2 text-sm">{release.notes}</h4>
        <ul className="list-none">
          {release.features.map((feature: Feature, index: number) => (
            <FeatureItem key={index} feature={feature} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const [month, day, year] = dateString.split("/");
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseDescription(description: string, contributorUrls: string[]) {
  const parts = description.split(/(\*\*@[^*]+\*\*)/g);
  let contributorIndex = 0;

  return parts.map((part, index) => {
    if (part.startsWith("**@") && part.endsWith("**")) {
      const mentionText = part.slice(2, -2);
      const githubUrl = contributorUrls[contributorIndex++];

      return githubUrl ? (
        <a
          key={index}
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue hover:text-blue/80 font-bold"
        >
          {mentionText}
        </a>
      ) : (
        <span key={index} className="font-bold">
          {mentionText}
        </span>
      );
    }

    return <span key={index}>{part}</span>;
  });
}
