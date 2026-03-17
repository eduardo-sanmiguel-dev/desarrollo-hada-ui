import type { NextConfig } from "next";

const backendUrl = process.env.API_BASE_URL || "http://localhost:4002";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      { source: "/auth/:path*", destination: `${backendUrl}/auth/:path*` },
      { source: "/areas/:path*", destination: `${backendUrl}/areas/:path*` },
      {
        source: "/workplaces/:path*",
        destination: `${backendUrl}/workplaces/:path*`,
      },
      {
        source: "/employees/:path*",
        destination: `${backendUrl}/employees/:path*`,
      },
      {
        source: "/projects/:path*",
        destination: `${backendUrl}/projects/:path*`,
      },
      {
        source: "/reasons-for-request/:path*",
        destination: `${backendUrl}/reasons-for-request/:path*`,
      },
      {
        source: "/personnel-requisitions/:path*",
        destination: `${backendUrl}/personnel-requisitions/:path*`,
      },
    ];
  },
};

export default nextConfig;
