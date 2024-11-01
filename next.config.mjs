/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://drawd.kro.kr/:path*',
            },
        ];
    },
};

export default nextConfig;
