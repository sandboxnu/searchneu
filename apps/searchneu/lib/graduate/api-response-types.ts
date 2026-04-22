import { SupportedMajors, SupportedMinors } from "./types";

/** Types our API responds with. */
export interface GetSupportedMajorsResponse {
  // { year => { majorName => {concentrations, minRequiredConcentrations} }}
  supportedMajors: SupportedMajors;
}

export interface GetSupportedMinorsResponse {
  supportedMinors: SupportedMinors;
}
