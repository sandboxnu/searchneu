const NUPATHS: { [key: string]: string } = {
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

const BANNER_NUP_CODES = Object.values(NUPATHS).map((c) => "NC" + c);

export function convertNupath(path: string) {
  return NUPATHS[path] ?? "??";
}

export function validNupath(code: string) {
  return BANNER_NUP_CODES.indexOf(code) > 0;
}
