/**
 * CLI display utilities — wraps @clack/prompts + picocolors.
 */
import * as p from "@clack/prompts";
import pc from "picocolors";

let _verbose = false;
let _veryVerbose = false;

export function setVerbosity(opts: {
  verbose?: boolean;
  veryVerbose?: boolean;
}) {
  _verbose = opts.verbose ?? false;
  _veryVerbose = opts.veryVerbose ?? false;
}

export function isVerbose() {
  return _verbose || _veryVerbose;
}

export function isTrace() {
  return _veryVerbose;
}

export function brandIntro(command: string) {
  p.intro(`${pc.inverse(" SearchNEU ")}  ${pc.dim("·")}  ${command}`);
}

export { p, pc };
