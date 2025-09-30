import data from './log.json';
import { Header } from "@/components/navigation/Header";

type Feature = {
    contributorUrls: string[]
    description: string
}

type Release = {
    version: string
    title: string
    date: string
    features: Feature[]
    notes: string
}

function formatDate(dateString: string): string {
    const [month, day, year] = dateString.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function ChangelogHero() {
    const numberOfCircles = 30;
    const circleSize = 400;
    
    return (
        <div 
            className="text-white py-24 px-6 text-center mb-8 rounded-lg relative overflow-hidden"
            style={{
                background: 'radial-gradient(circle, #CF333F 0%, #F08890 150%)'
            }}
        >
            {/* Background circles */}
            <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: numberOfCircles }, (_, index) => {
                    // Calculate spacing so circles are evenly distributed and overlap naturally
                    const totalWidth = 120;
                    const startPosition = -10; // Make first circle start further left
                    const leftPosition = startPosition + (index / (numberOfCircles - 1)) * totalWidth;
                    
                    return (
                        <div 
                            key={index}
                            className="absolute top-1/2 rounded-full"
                            style={{
                                width: `${circleSize}px`,
                                height: `${circleSize}px`,
                                left: `${leftPosition}%`,
                                transform: `translateX(-50%) translateY(-50%)`,
                                background: `linear-gradient(to right, rgba(255,255,255,0.0), rgba(255,255,255,0.04))`,
                                zIndex: Math.max(1, numberOfCircles - index)
                            }}
                        />
                    );
                })}
            </div>

            {/* Banner content */}
            <div className="max-w-4xl mx-auto relative" style={{ zIndex: numberOfCircles + 10 }}>
                <p className="text-sm uppercase tracking-wider mb-2 opacity-90">CHANGELOG</p>
                <h1 className="text-4xl font-bold mb-4">See what's new with SearchNEU</h1>
                <p className="text-lg opacity-90 max-w-2xl mx-auto">
                    What's new with you? Our amazing team at Sandbox is always adding features 
                    and improvements, so stay up to date with all of our updates here.
                </p>
            </div>
        </div>
    );
}

function TimelineDot() {
    return (
        <div className="absolute w-5 h-5 bg-red-500 border-5 border-red-200 rounded-full transform -translate-x-[39px] translate-y-[2px]" />
    );
}

function ContributorTag({ contributorUrl }: { contributorUrl: string }) {
    const username = contributorUrl.split("/").at(-1);
    
    return (
        <a 
            href={contributorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white border border-gray-300 rounded-full px-4 py-0.5 text-xs mr-1 mb-1 hover:bg-gray-100 transition-colors"
        >
            {username}
        </a>
    );
}

function FeatureItem({ feature }: { feature: Feature }) {
    return (
        <li className="flex items-start">
            <span className="text-sm mt-[3px] mr-2">•</span>
            <div className="flex-1">
                <p>{feature.description}</p>
                <p>
                    {feature.contributorUrls.map((contributorUrl: string, index: number) => (
                        <ContributorTag 
                            key={index} 
                            contributorUrl={contributorUrl} 
                        />
                    ))}
                </p>
            </div>
        </li>
    );
}

function ReleaseCard({ release }: { release: Release }) {
    return (
        <div className="mb-8 max-w-[625px] w-full relative z-10">
            <TimelineDot />
            
            <h2 className="text-gray-600">{formatDate(release.date)} - v{release.version}</h2>
            <div className="bg-white p-4 rounded-lg mt-2 border border-gray-300 shadow-gray-200 shadow-md">
                <div 
                    className="w-full rounded-sm mb-2" 
                    style={{ aspectRatio: '475/180', backgroundColor: '#1C313F' }}
                />
                <h3 className="text-lg font-bold mb-2">{release.title}</h3>
                <h4 className="text-gray-600 mb-2">{release.notes}</h4>
                <ul className="list-none mb-2">
                    {release.features.map((feature: Feature, index: number) => (
                        <FeatureItem key={index} feature={feature} />
                    ))}
                </ul>
            </div>
        </div>
    );
}

function Timeline() {
    return (
        <div 
            className="absolute left-1/2 top-5 h-full w-0.5 bg-gray-300 transform -translate-x-[342.5px]" 
            style={{
                backgroundImage: 'repeating-linear-gradient(to bottom, #d1d5db 0px, #d1d5db 4px, #f3f4f6 4px, #f3f4f6 8px)'
            }}
        />
    );
}

function Changelog() {
    const releases = data.releases;

    return (
        <>
            <Header />
            <div className="bg-gray-100 min-h-screen p-6">
                <ChangelogHero />
                
                <div className="relative z-10">
                    <div className="flex flex-col items-center relative">
                        <Timeline />
                        
                        {releases.map((release: Release, index: number) => (
                            <ReleaseCard 
                                key={`${release.version}-${index}`} 
                                release={release} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Changelog;