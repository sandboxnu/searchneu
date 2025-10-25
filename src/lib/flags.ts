import { flag } from "flags/next";

export const reactScanFlag = flag({
  key: "react-scan",
  description: "Enable React Scan debug tools",
  decide() {
    return false;
  },
});

export const faqFlag = flag({
  key: "faq-page",
  description: "Enable FAQ page",
  decide() {
    return false;
  },
});

export const roomsFlag = flag({
  key: "rooms",
  description: "Enable experimental rooms page",
  decide() {
    return false;
  },
});

export const schedulerFlag = flag({
  key: "scheduler",
  description: "Enable scheduler page",
  decide() {
    return false;
  },
});
