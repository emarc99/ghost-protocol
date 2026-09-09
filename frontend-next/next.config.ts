import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  turbopack: {
    root: "c:/Users/LENOVO/Documents/devposts/ghost/frontend-next"
  }
};

export default nextConfig;
