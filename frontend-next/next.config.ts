import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  turbopack: {
    root: path.resolve(__dirname, "..")
  }
};

export default nextConfig;
