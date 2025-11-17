import type { Config, TermScrape } from "./types";

function isValidNupath(code: string, config: Config) {
  return config.attributes.nupath.some((n) => n.short === code);
}

export function convertCampus(code: string, config: Config): string {
  const campusConfig = config.attributes.campus.find((c) => c.code === code);
  if (!campusConfig) {
    throw new Error(
      `Invalid campus code: "${code}". Campus not found in config. Please add this campus to manifest.yaml before uploading.`,
    );
  }
  return campusConfig.name ?? campusConfig.code;
}

export function validateCache(data: TermScrape, config: Config) {
  // Validate all campuses before starting transaction
  const uniqueCampuses = new Set<string>();
  for (const course of data.courses) {
    for (const section of course.sections) {
      uniqueCampuses.add(section.campus);
    }
  }

  for (const campusCode of uniqueCampuses) {
    try {
      convertCampus(campusCode, config);
    } catch (error) {
      console.error(`\n❌ ${(error as Error).message}\n`);
      throw error;
    }
  }
}
