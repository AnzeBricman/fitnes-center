import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/members", destination: "/admin/members", permanent: false },
      { source: "/trainer", destination: "/trainers", permanent: false },
      { source: "/workout", destination: "/workouts", permanent: false },
      {
        source: "/subscriptions",
        destination: "/admin/subscriptions",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
