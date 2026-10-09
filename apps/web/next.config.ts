import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  outputFileTracingIncludes: {
    "/*": ["../../content/.published/**/*.json"],
  },
  transpilePackages: ["@academy/contracts", "@academy/course-engine", "@academy/exercise-engine", "@academy/grading", "@academy/shared"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
