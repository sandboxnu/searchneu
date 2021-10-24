import { NextApiRequest, NextApiResponse } from 'next';
import { getLatestTerm } from '../../components/global';
import { Campus } from '../../components/types';
import { GetPagesForSitemapQuery } from '../../generated/graphql';
import { gqlClient } from '../../utils/courseAPIClient';

// Execute the proc on each search result in the given termId
async function forEachSearchResult(
  termId: string,
  proc: (item: GetPagesForSitemapQuery['search']['nodes'][0]) => void
) {
  let offset = 0;
  let hasNextPage = false;
  do {
    const data = await gqlClient.getPagesForSitemap({ termId, offset });

    for (const item of data.search.nodes) {
      proc(item);
    }
    hasNextPage = data.search.pageInfo.hasNextPage;
    offset += 1000;
  } while (hasNextPage);
}

async function generateSitemap(): Promise<string> {
  const start = Date.now();

  // Items to link to.
  // The part after the https://searchneu.com/
  const items: Set<string> = new Set();

  // latest terms for each campus
  const latestTerms: [Campus, string][] = Object.values(Campus).map((c) => [
    c,
    getLatestTerm(c),
  ]);

  // Add the classes
  for (const [campus, termId] of latestTerms) {
    await forEachSearchResult(termId, (course) => {
      if (course.__typename === 'ClassOccurrence') {
        items.add(
          `${campus}/${termId}/search/${course.subject}${course.classId}`
        );
        items.add(
          `${campus}/${termId}/search/${encodeURIComponent(course.name)}`
        );
        items.add(
          `${campus}/${termId}/classPage/${course.subject}/${course.classId}`
        );
      }
    });
  }

  // Add the employees
  const latestNEU = getLatestTerm(Campus.NEU);
  await forEachSearchResult(latestNEU, (employee) => {
    if (employee.__typename === 'Employee') {
      items.add(
        `${Campus.NEU}/${latestNEU}/search/${encodeURIComponent(employee.name)}`
      );
    }
  });

  // Convert the items to urls and put them inside xml
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  items.forEach((item) => {
    xml.push('  <url>');
    xml.push(`    <loc>https://searchneu.com/${item}</loc>`);
    xml.push('  </url>');
  });
  xml.push('</urlset>');

  const output = xml.join('\n');

  console.log(`generated sitemap in ${Date.now() - start}ms`);
  return output;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/xml');

  // Have Vercel cache for 30 days for us https://vercel.com/docs/serverless-functions/edge-caching
  res.setHeader('Cache-Control', 's-maxage=2592000, stale-while-revalidate');
  res.write(await generateSitemap());
  res.end();
}
