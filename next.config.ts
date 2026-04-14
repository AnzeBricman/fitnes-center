import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/members", destination: "/admin/members", permanent: false },
      { source: "/trainers", destination: "/admin/trainers", permanent: false },
      { source: "/workouts", destination: "/admin/workouts", permanent: false },
      {
        source: "/subscriptions",
        destination: "/admin/subscriptions",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
