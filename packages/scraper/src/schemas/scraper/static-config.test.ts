import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  StaticCampus,
  StaticCampusesConfig,
  StaticBuilding,
  StaticBuildingsConfig,
  StaticSubject,
  StaticSubjectsConfig,
  StaticNupath,
  StaticNupathsConfig,
  StaticPartOfTermConfig,
  StaticTermConfig,
  StaticManifestConfig,
} from "./static-config.js";

describe("StaticCampus", () => {
  test("valid campus with all fields", () => {
    const result = StaticCampus.safeParse({
      code: "BOS",
      name: "Boston",
      group: "Main",
      aliases: ["boston"],
    });
    assert.equal(result.success, true);
  });

  test("valid campus without optional aliases", () => {
    const result = StaticCampus.safeParse({
      code: "BOS",
      name: "Boston",
      group: "Main",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing required group", () => {
    const result = StaticCampus.safeParse({
      code: "BOS",
      name: "Boston",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticCampus.safeParse({
      code: "BOS",
      name: "Boston",
      group: "Main",
      extra: true,
    });
    assert.equal(result.success, false);
  });
});

describe("StaticCampusesConfig", () => {
  test("valid campuses config", () => {
    const result = StaticCampusesConfig.safeParse({
      campuses: [{ code: "BOS", name: "Boston", group: "Main" }],
    });
    assert.equal(result.success, true);
  });

  test("valid with empty campuses array", () => {
    const result = StaticCampusesConfig.safeParse({ campuses: [] });
    assert.equal(result.success, true);
  });

  test("rejects missing campuses key", () => {
    const result = StaticCampusesConfig.safeParse({});
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticCampusesConfig.safeParse({
      campuses: [],
      extra: true,
    });
    assert.equal(result.success, false);
  });
});

describe("StaticBuilding", () => {
  test("valid building with all fields", () => {
    const result = StaticBuilding.safeParse({
      code: "WVH",
      name: "West Village H",
      campus: "BOS",
      aliases: ["west village h"],
    });
    assert.equal(result.success, true);
  });

  test("valid building without optional aliases", () => {
    const result = StaticBuilding.safeParse({
      code: "WVH",
      name: "West Village H",
      campus: "BOS",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing required campus", () => {
    const result = StaticBuilding.safeParse({
      code: "WVH",
      name: "West Village H",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticBuilding.safeParse({
      code: "WVH",
      name: "West Village H",
      campus: "BOS",
      floors: 5,
    });
    assert.equal(result.success, false);
  });
});

describe("StaticBuildingsConfig", () => {
  test("valid buildings config", () => {
    const result = StaticBuildingsConfig.safeParse({
      buildings: [{ code: "WVH", name: "West Village H", campus: "BOS" }],
    });
    assert.equal(result.success, true);
  });

  test("rejects missing buildings key", () => {
    const result = StaticBuildingsConfig.safeParse({});
    assert.equal(result.success, false);
  });
});

describe("StaticSubject", () => {
  test("valid subject with all fields", () => {
    const result = StaticSubject.safeParse({
      code: "CS",
      description: "Computer Science",
      aliases: ["comp sci"],
    });
    assert.equal(result.success, true);
  });

  test("valid subject without optional aliases", () => {
    const result = StaticSubject.safeParse({
      code: "CS",
      description: "Computer Science",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing required description", () => {
    const result = StaticSubject.safeParse({
      code: "CS",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticSubject.safeParse({
      code: "CS",
      description: "Computer Science",
      department: "Khoury",
    });
    assert.equal(result.success, false);
  });
});

describe("StaticSubjectsConfig", () => {
  test("valid subjects config", () => {
    const result = StaticSubjectsConfig.safeParse({
      subjects: [{ code: "CS", description: "Computer Science" }],
    });
    assert.equal(result.success, true);
  });

  test("rejects missing subjects key", () => {
    const result = StaticSubjectsConfig.safeParse({});
    assert.equal(result.success, false);
  });
});

describe("StaticNupath", () => {
  test("valid nupath with all fields", () => {
    const result = StaticNupath.safeParse({
      code: "WI",
      short: "Writing Intensive",
      name: "Writing Intensive NUpath",
      aliases: ["writing"],
    });
    assert.equal(result.success, true);
  });

  test("valid nupath without optional aliases", () => {
    const result = StaticNupath.safeParse({
      code: "WI",
      short: "Writing Intensive",
      name: "Writing Intensive NUpath",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing required short", () => {
    const result = StaticNupath.safeParse({
      code: "WI",
      name: "Writing Intensive NUpath",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticNupath.safeParse({
      code: "WI",
      short: "Writing Intensive",
      name: "Writing Intensive NUpath",
      credits: 4,
    });
    assert.equal(result.success, false);
  });
});

describe("StaticNupathsConfig", () => {
  test("valid nupaths config", () => {
    const result = StaticNupathsConfig.safeParse({
      nupaths: [
        {
          code: "WI",
          short: "Writing Intensive",
          name: "Writing Intensive NUpath",
        },
      ],
    });
    assert.equal(result.success, true);
  });

  test("rejects missing nupaths key", () => {
    const result = StaticNupathsConfig.safeParse({});
    assert.equal(result.success, false);
  });
});

describe("StaticPartOfTermConfig", () => {
  test("valid with all fields", () => {
    const result = StaticPartOfTermConfig.safeParse({
      code: "1",
      name: "Full Term",
      activeUntil: "2025-12-15",
    });
    assert.equal(result.success, true);
  });

  test("valid with only required code", () => {
    const result = StaticPartOfTermConfig.safeParse({
      code: "1",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing required code", () => {
    const result = StaticPartOfTermConfig.safeParse({
      name: "Full Term",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticPartOfTermConfig.safeParse({
      code: "1",
      extra: true,
    });
    assert.equal(result.success, false);
  });
});

describe("StaticTermConfig", () => {
  test("valid with all fields", () => {
    const result = StaticTermConfig.safeParse({
      term: 202510,
      name: "Fall 2025",
      activeUntil: "2025-12-15",
      splitByPartOfTerm: true,
      parts: [{ code: "1", name: "Full Term" }],
    });
    assert.equal(result.success, true);
  });

  test("valid with only required fields", () => {
    const result = StaticTermConfig.safeParse({
      term: 202510,
      activeUntil: "2025-12-15",
    });
    assert.equal(result.success, true);
  });

  test("rejects missing required activeUntil", () => {
    const result = StaticTermConfig.safeParse({
      term: 202510,
    });
    assert.equal(result.success, false);
  });

  test("term must be an integer", () => {
    const result = StaticTermConfig.safeParse({
      term: 2025.5,
      activeUntil: "2025-12-15",
    });
    assert.equal(result.success, false);
  });

  test("term rejects string", () => {
    const result = StaticTermConfig.safeParse({
      term: "202510",
      activeUntil: "2025-12-15",
    });
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticTermConfig.safeParse({
      term: 202510,
      activeUntil: "2025-12-15",
      extra: true,
    });
    assert.equal(result.success, false);
  });
});

describe("StaticManifestConfig", () => {
  test("valid manifest config", () => {
    const result = StaticManifestConfig.safeParse({
      terms: [{ term: 202510, activeUntil: "2025-12-15" }],
    });
    assert.equal(result.success, true);
  });

  test("valid with empty terms array", () => {
    const result = StaticManifestConfig.safeParse({ terms: [] });
    assert.equal(result.success, true);
  });

  test("rejects missing terms key", () => {
    const result = StaticManifestConfig.safeParse({});
    assert.equal(result.success, false);
  });

  test("rejects extra fields (strictObject)", () => {
    const result = StaticManifestConfig.safeParse({
      terms: [],
      version: 1,
    });
    assert.equal(result.success, false);
  });

  test("rejects invalid term inside array", () => {
    const result = StaticManifestConfig.safeParse({
      terms: [{ term: "notanumber", activeUntil: "2025-12-15" }],
    });
    assert.equal(result.success, false);
  });
});
