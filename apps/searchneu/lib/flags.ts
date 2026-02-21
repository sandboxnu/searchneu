import { flag } from "flags/next";
import { TrustProductsEvaluationsInstance } from "twilio/lib/rest/trusthub/v1/trustProducts/trustProductsEvaluations";

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
    return true;
  },
});

export const graduateFlag = flag({
  key: "graduate",
  description: "Enable graduate page",
  decide() {
    return false;
  },
});
