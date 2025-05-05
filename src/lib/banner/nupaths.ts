const NUPATH_CODES: { [key: string]: string } = {
  "NUpath Natural/Designed World": "ND",
  "NUpath Creative Express/Innov": "EI",
  "NUpath Interpreting Culture": "IC",
  "NUpath Formal/Quant Reasoning": "FQ",
  "NUpath Societies/Institutions": "SI",
  "NUpath Analyzing/Using Data": "AD",
  "NUpath Difference/Diversity": "DD",
  "NUpath Ethical Reasoning": "ER",
  "NU Core/NUpath 1st Yr Writing": "WF",
  "NUpath Writing Intensive": "WI",
  "NU Core/NUpath Adv Writ Dscpl": "WD",
  "NUpath Integration Experience": "EX",
  "NUpath Capstone Experience": "CE",
};

const NUPATH_LONGFORMS: { [key: string]: string } = {
  "NUpath Natural/Designed World": "Natural/Designed World (ND)",
  "NUpath Creative Express/Innov": "Creative Express/Innov (EI)",
  "NUpath Interpreting Culture": "Interpreting Culture (IC)",
  "NUpath Formal/Quant Reasoning": "Formal/Quant Reasoning (FQ)",
  "NUpath Societies/Institutions": "Societies/Institutions (SI)",
  "NUpath Analyzing/Using Data": "Analyzing/Using Data (AD)",
  "NUpath Difference/Diversity": "Difference/Diversity (DD)",
  "NUpath Ethical Reasoning": "Ethical Reasoning (ER)",
  "NU Core/NUpath 1st Yr Writing": "First Year Writing (WF)",
  "NUpath Writing Intensive": "Writing Intensive (WI)",
  "NU Core/NUpath Adv Writ Dscpl": "Advanced Writing (WD)",
  "NUpath Integration Experience": "Integration Experience (EX)",
  "NUpath Capstone Experience": "Capstone Experience (CE)",
};

export const NUPATH_OPTIONS = [
  { value: "ND", label: "Natural/Designed World (ND)" },
  { value: "EI", label: "Creative Express/Innov (EI)" },
  { value: "IC", label: "Interpreting Culture (IC)" },
  { value: "FQ", label: "Formal/Quant Reasoning (FQ)" },
  { value: "SI", label: "Societies/Institutions (SI)" },
  { value: "AD", label: "Analyzing/Using Data (AD)" },
  { value: "DD", label: "Difference/Diversity (DD)" },
  { value: "EF", label: "Ethical Reasoning (ER)" },
  { value: "WF", label: "First Year Writing (WF)" },
  { value: "WI", label: "Writing Intensive (WI)" },
  { value: "WD", label: "Advanced Writing (WD)" },
  { value: "EX", label: "Integration Experience (EX)" },
  { value: "CE", label: "Capstone Experience (CE)" },
];

const BANNER_NUP_CODES = Object.values(NUPATH_CODES).map((c) => "NC" + c);

export function convertNupathToCode(path: string) {
  return NUPATH_CODES[path] ?? "??";
}

export function isValidNupath(code: string) {
  return BANNER_NUP_CODES.indexOf(code) > 0;
}

export function convertNupathToLongform(path: string) {
  return NUPATH_LONGFORMS[path] ?? "??";
}
