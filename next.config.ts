import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  devIndicators: {
    position: "bottom-right"
  },
  images: {
    remotePatterns: [
      new URL("https://**.googleusercontent.com/**"),
      new URL(`${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL!}/**`)
    ]
  },
  experimental: {
    authInterrupts: true
  },
  redirects: async () => [
    {
      source: "/settings",
      destination: "/settings/account",
      permanent: true
    }
  ]
};

export default nextConfig;
