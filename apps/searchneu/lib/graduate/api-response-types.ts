import {
  SupportedMajors,
  MetaInfo,
  Maybe,
  SupportedMinors,
} from "./types";

/** Types our API responds with. */
export interface GetSupportedMajorsResponse {
  // { year => { majorName => {concentrations, minRequiredConcentrations} }}
  supportedMajors: SupportedMajors;
}

export interface GetSupportedMinorsResponse {
  supportedMinors: SupportedMinors;
}

export interface GetMetaInfoResponse extends MetaInfo {
  commit: Maybe<string>;
  commitMessage: Maybe<string>;
  build_timestamp: Maybe<number>;
  environment: Maybe<string>;
}



