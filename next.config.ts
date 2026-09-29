import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The research engine reads the shared methodology at run time; make sure it ships with that page.
  outputFileTracingIncludes: {
    "/admin/research": ["./docs/research-methodology.md"],
  },
};

export default nextConfig;
