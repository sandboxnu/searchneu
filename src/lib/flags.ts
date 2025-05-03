import { flag } from "flags/next";

export const reactScanFlag = flag({
  key: "react-scan",
  description: "Enable React Scan debug tools",
  decide() {
    return false;
  },
});
