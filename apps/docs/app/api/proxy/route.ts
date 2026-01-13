import { openapi } from "@/lib/openapi";
export const { GET, HEAD, PUT, POST, PATCH, DELETE } = openapi.createProxy({
  // optional, we recommend to set a list of allowed origins for proxied requests
  allowedOrigins: ["https://nubanner.neu.edu"],
});
