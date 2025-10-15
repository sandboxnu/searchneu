import data from './log.json';
import { Header } from "@/components/navigation/Header";

type Feature = {
    contributorUrls: string[]
    description: string
}

type Release = {
    version: string
    title: string
    notes: string
    date: string
    image: string
    features: Feature[]
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

function parseDescription(description: string, contributorUrls: string[]) {
    const parts = description.split(/(\*\*@[^*]+\*\*)/g);
    let contributorIndex = 0;
    
    return parts.map((part, index) => {
        if (part.startsWith('**@') && part.endsWith('**')) {
            const mentionText = part.slice(2, -2);
            const githubUrl = contributorUrls[contributorIndex++];
            
            return githubUrl ? (
                <a 
                    key={index}
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black font-bold hover:text-gray-700"
                >
                    {mentionText}
                </a>
            ) : (
                <span key={index} className="font-bold">{mentionText}</span>
            );
        }
        
        return <span key={index}>{part}</span>;
    });
}

function ChangelogHero() {
    const numberOfCircles = 30;
    const circleSize = 400;
    
    return (
        <div 
            className="text-white px-6 text-center mb-16 rounded-xl relative overflow-hidden flex items-center justify-center"
            style={{
                background: 'radial-gradient(circle, #CF333F 0%, #F08890 150%)',
                height: '288px'
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
                <p className="text-base uppercase tracking-wider mb-2 opacity-90 font-bold">CHANGELOG</p>
                <h1 className="text-4xl font-bold mb-4">See what&apos;s new with SearchNEU</h1>
                <p className="font-medium opacity-90 max-w-2xl mx-auto">
                    What&apos;s new with you? Our amazing team at Sandbox is always adding features 
                    and improvements, so stay up to date with all of our updates here.
                </p>
            </div>
        </div>
    );
}

function FeatureItem({ feature }: { feature: Feature }) {
    return (
        <li className="flex items-start">
            <span className="text-sm mr-2">•</span>
            <div className="flex-1">
                <p className="text-sm">
                    {parseDescription(feature.description, feature.contributorUrls)}
                </p>
            </div>
        </li>
    );
}

function ReleaseCard({ release }: { release: Release }) {
    return (
        <div className="mb-8 max-w-[538px] w-full relative z-10">
            <TimelineDot />
            
            <h2 className="text-[#5F5F5F] text-sm mb-2">{formatDate(release.date)} - v{release.version}</h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-gray-100 shadow-md">
                <img src={"/images/changelog/" + release.image} alt="Changelog_Image_1.png" className="w-full rounded-sm mb-4" style={{ aspectRatio: '475/180', backgroundColor: '#1C313F' }}/>
                <h3 className="text-base font-black mb-2">{release.title}</h3>
                <h4 className="text-sm text-gray-600 mb-2">{release.notes}</h4>
                <ul className="list-none">
                    {release.features.map((feature: Feature, index: number) => (
                        <FeatureItem key={index} feature={feature} />
                    ))}
                </ul>
            </div>
        </div>
    );
}

function TimelineDot() {
    return (
        <div className="absolute w-4 h-4 bg-[#E63946] border-4 border-[#FAD7DA] rounded-full transform -translate-x-[30px] translate-y-[1px]" />
    );
}

function Timeline() {
    return (
        <div 
            className="absolute left-1/2 top-5 h-full w-0.5 bg-gray-300 transform -translate-x-[292px]" 
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

            <div className="min-h-screen py-6 px-8">
                <ChangelogHero />

                <div className="bg-gray-100 fixed -z-1 inset-0 pointer-events-none overflow-hidden">
                    <div className="grid grid-cols-16 gap-4 w-full h-full p-8">
                        {Array.from({ length: 128 }, (_, index) => {
                            const row = Math.floor(index / 16);
                            const staggerOffset = (row % 2) * 25;
                            
                            return (
                                <img 
                                    key={index}
                                    src="/svgs/changelog/NEU.svg" 
                                    alt="" 
                                    className="w-full h-full object-contain max-w-[120px] max-h-[120px] mx-auto opacity-50"
                                    style={{
                                        transform: `translateX(${staggerOffset}px)`
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
                
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