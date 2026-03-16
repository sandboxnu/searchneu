import { flag } from "flags/next";

export const faqHowToFlag = flag({
  key: "faq-how-to",
  description: "Enable FAQ how-to section",
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

export const graduateFlag = flag({
  key: "graduate",
  description: "Enable graduate page",
  decide() {
    return false;
  },
});
