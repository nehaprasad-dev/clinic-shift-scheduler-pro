import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Keep the seeded SQLite file available to server routes on Vercel
  outputFileTracingIncludes: {
    "/*": [
      "./prisma/deploy.db",
      "./prisma/schema.prisma",
      "./prisma/migrations/**/*",
      "./staff.csv",
      "./shifts.csv",
    ],
  },
};

export default nextConfig;
