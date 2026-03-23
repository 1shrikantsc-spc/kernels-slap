import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
        ],
    },
   async rewrites() {
    return [
        {
            source: "/api/:path*",
            destination: "https://kernels-slap-backend.onrender.com/api/:path*",
        },
    ];
}

export default nextConfig;
