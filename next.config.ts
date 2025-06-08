import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "top-right"
  },
  images: {
    remotePatterns: [
      new URL("https://**.googleusercontent.com/**"),
      new URL(`${process.env.NEXT_PUBLIC_IMAGE_BUCKET_URL!}/**`)
    ]
  }
};

export default nextConfig;
