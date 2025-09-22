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
            
            <h2 className="text-gray-600">{release.date} - v{release.version}</h2>
            <div className="bg-white p-4 rounded-lg mt-2 border border-gray-300 shadow-gray-200 shadow-md">
                <div 
                    className="w-full bg-red-500 rounded-sm mb-2" 
                    style={{ aspectRatio: '475/180' }}
                />
                <h3 className="text-lg font-bold mb-2">{release.title}</h3>
                <ul className="list-none mb-2">
                    {release.features.map((feature: Feature, index: number) => (
                        <FeatureItem key={index} feature={feature} />
                    ))}
                </ul>
                <h4 className="text-gray-600">Additional Notes: {release.notes}</h4>
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
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold text-center mb-2">Changelog</h1>
                    <p className="text-center text-gray-600 mb-8">See all updates and changes to SearchNEU</p>
                    
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