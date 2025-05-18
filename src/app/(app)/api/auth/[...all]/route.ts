import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

// export const { POST, GET } = toNextJsHandler(auth);
export const { POST } = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  console.log(req.url);
  console.log(req.headers);

  const next = toNextJsHandler(auth).GET;
  const res = await next(req);

  console.log("response", res.headers);
  // if (c) {
  //   const a = cookieJar.set({ name: "a", value: c });
  //   console.log(a);
  // }

  console.log("responsesss", res.headers);

  console.log("e", res);

  return res;
}
