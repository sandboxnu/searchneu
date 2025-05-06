import { flag } from "flags/next";

export const reactScanFlag = flag({
  key: "react-scan",
  description: "Enable React Scan debug tools",
  decide() {
    return false;
  },
});

export const advancedSearchFlag = flag({
  key: "advanced-search",
  description: "Advanced Search using Fuse over db searching",
  decide() {
    return false;
  },
});
